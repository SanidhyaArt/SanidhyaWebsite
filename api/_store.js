const crypto = require("node:crypto");
const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  readRequestBody,
  sendJson,
} = require("./_freebies-security");

const storeCatalog = {
  "course-compositing-photoshop": {
    id: "course-compositing-photoshop",
    type: "course",
    title: "Compositing in Photoshop",
    successPath: "/courses",
    cancelPath: "/courses",
    stripePriceEnv: "SANIDHYA_STRIPE_PRICE_COURSE_COMPOSITING_PHOTOSHOP",
  },
};

const getSupabaseConfig = () => ({
  url: String(
    process.env.SANIDHYA_SUPABASE_URL ||
      "https://cuuutlobfwetrtnrcela.supabase.co"
  ).trim(),
  anonKey: String(
    process.env.SANIDHYA_SUPABASE_ANON_KEY ||
      "sb_publishable_IhLdTf5ckrSHsafKWBB1rw_5-z4myWu"
  ).trim(),
  serviceRoleKey: String(
    process.env.SANIDHYA_SUPABASE_SERVICE_ROLE_KEY || ""
  ).trim(),
});

const getStripeConfig = () => ({
  secretKey: String(process.env.SANIDHYA_STRIPE_SECRET_KEY || "").trim(),
  webhookSecret: String(
    process.env.SANIDHYA_STRIPE_WEBHOOK_SECRET || ""
  ).trim(),
});

const getProductById = (productId) => storeCatalog[String(productId || "").trim()] || null;

const getStripePriceIdForProduct = (product) =>
  String(process.env[product?.stripePriceEnv] || "").trim();

const getBearerToken = (req) => {
  const authorizationHeader = String(req.headers.authorization || "").trim();

  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorizationHeader.slice(7).trim();
};

const verifySupabaseSession = async (accessToken) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !accessToken) {
    return null;
  }

  const authResponse = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!authResponse.ok) {
    return null;
  }

  return authResponse.json();
};

const getBaseSiteUrl = (req) => {
  const protocol = String(req.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();

  return host ? `${protocol}://${host}` : "";
};

const encodeFormBody = (payload) => {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  return params.toString();
};

const getSupabaseRestHeaders = () => {
  const { serviceRoleKey } = getSupabaseConfig();

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
};

const getMemberUnlock = async ({ userId, productId }) => {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey || !userId || !productId) {
    return null;
  }

  const query = new URLSearchParams({
    select: "product_id,status,user_email,provider,provider_reference,created_at,updated_at",
    user_id: `eq.${userId}`,
    product_id: `eq.${productId}`,
    status: "eq.active",
    limit: "1",
  });

  const response = await fetch(`${url}/rest/v1/member_unlocks?${query.toString()}`, {
    method: "GET",
    headers: getSupabaseRestHeaders(),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => []);
  return Array.isArray(payload) && payload.length ? payload[0] : null;
};

const upsertMemberUnlock = async ({
  userId,
  userEmail = "",
  productId,
  provider = "stripe",
  providerReference = "",
  metadata = {},
}) => {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey || !userId || !productId) {
    return false;
  }

  const response = await fetch(
    `${url}/rest/v1/member_unlocks?on_conflict=user_id,product_id`,
    {
      method: "POST",
      headers: {
        ...getSupabaseRestHeaders(),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        user_email: userEmail,
        product_id: productId,
        provider,
        provider_reference: providerReference,
        status: "active",
        metadata,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  return response.ok;
};

const createStripeCheckoutSession = async ({
  req,
  product,
  user,
}) => {
  const { secretKey } = getStripeConfig();
  const priceId = getStripePriceIdForProduct(product);
  const baseUrl = getBaseSiteUrl(req);

  if (!secretKey || !priceId || !baseUrl) {
    return null;
  }

  const successUrl = new URL(product.successPath, baseUrl);
  successUrl.searchParams.set("purchase", "success");
  successUrl.searchParams.set("product", product.id);

  const cancelUrl = new URL(product.cancelPath, baseUrl);
  cancelUrl.searchParams.set("purchase", "cancelled");
  cancelUrl.searchParams.set("product", product.id);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeFormBody({
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": 1,
      client_reference_id: user.id,
      customer_email: user.email || "",
      allow_promotion_codes: "true",
      "metadata[product_id]": product.id,
      "metadata[user_id]": user.id,
      "metadata[user_email]": user.email || "",
    }),
  });

  if (!stripeResponse.ok) {
    const stripeError = await stripeResponse.json().catch(() => ({}));
    throw new Error(
      stripeError?.error?.message || "Could not create the Stripe checkout session."
    );
  }

  return stripeResponse.json();
};

const verifyStripeSignature = (rawBody, signatureHeader) => {
  const { webhookSecret } = getStripeConfig();

  if (!webhookSecret || !signatureHeader || !rawBody) {
    return false;
  }

  const parsedSignature = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((entry) => entry.split("=", 2).map((item) => item.trim()))
      .filter(([key, value]) => key && value)
  );

  const timestamp = parsedSignature.t || "";
  const signature = parsedSignature.v1 || "";

  if (!timestamp || !signature) {
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));

  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const readRawRequestBody = (req, maxBytes = 256 * 1024) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body, "utf8") > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

module.exports = {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  createStripeCheckoutSession,
  getBearerToken,
  getMemberUnlock,
  getProductById,
  getStripeConfig,
  getStripePriceIdForProduct,
  getSupabaseConfig,
  readRawRequestBody,
  readRequestBody,
  sendJson,
  upsertMemberUnlock,
  verifyStripeSignature,
  verifySupabaseSession,
};
