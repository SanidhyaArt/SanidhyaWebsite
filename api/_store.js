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
    description: "A focused walkthrough on cleaner image compositing in Photoshop.",
    amountEnv: "SANIDHYA_RAZORPAY_AMOUNT_COURSE_COMPOSITING_PHOTOSHOP",
    currencyEnv: "SANIDHYA_RAZORPAY_CURRENCY_COURSE_COMPOSITING_PHOTOSHOP",
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

const getRazorpayConfig = () => ({
  keyId: String(process.env.SANIDHYA_RAZORPAY_KEY_ID || "").trim(),
  keySecret: String(process.env.SANIDHYA_RAZORPAY_KEY_SECRET || "").trim(),
  webhookSecret: String(
    process.env.SANIDHYA_RAZORPAY_WEBHOOK_SECRET || ""
  ).trim(),
});

const getProductById = (productId) =>
  storeCatalog[String(productId || "").trim()] || null;

const getProductAmount = (product) => {
  const rawAmount = String(process.env[product?.amountEnv] || "").trim();
  const parsedAmount = Number.parseInt(rawAmount, 10);
  return Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
};

const getProductCurrency = (product) =>
  String(process.env[product?.currencyEnv] || "INR").trim().toUpperCase();

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
    select:
      "product_id,status,user_email,provider,provider_reference,created_at,updated_at",
    user_id: `eq.${userId}`,
    product_id: `eq.${productId}`,
    status: "eq.active",
    limit: "1",
  });

  const response = await fetch(
    `${url}/rest/v1/member_unlocks?${query.toString()}`,
    {
      method: "GET",
      headers: getSupabaseRestHeaders(),
    }
  );

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
  provider = "razorpay",
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

const getRazorpayAuthorizationHeader = () => {
  const { keyId, keySecret } = getRazorpayConfig();

  if (!keyId || !keySecret) {
    return "";
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`, "utf8").toString(
    "base64"
  )}`;
};

const createReceipt = (productId, userId) => {
  const safeProduct = String(productId || "")
    .replace(/[^a-z0-9]+/gi, "-")
    .slice(0, 16);
  const safeUser = String(userId || "")
    .replace(/[^a-z0-9]+/gi, "")
    .slice(-10);
  const timestamp = Date.now().toString(36).slice(-8);
  return `${safeProduct}-${safeUser}-${timestamp}`.slice(0, 40);
};

const createRazorpayOrder = async ({ product, user }) => {
  const authorizationHeader = getRazorpayAuthorizationHeader();
  const amount = getProductAmount(product);
  const currency = getProductCurrency(product);

  if (!authorizationHeader || !amount || !currency) {
    return null;
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authorizationHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: createReceipt(product.id, user.id),
      notes: {
        product_id: product.id,
        product_title: product.title,
        user_id: user.id,
        user_email: user.email || "",
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      payload?.error?.description ||
        payload?.error?.reason ||
        "Could not create the Razorpay order."
    );
  }

  return response.json();
};

const fetchRazorpayOrder = async (orderId) => {
  const authorizationHeader = getRazorpayAuthorizationHeader();

  if (!authorizationHeader || !orderId) {
    return null;
  }

  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: authorizationHeader,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
};

const fetchRazorpayPayment = async (paymentId) => {
  const authorizationHeader = getRazorpayAuthorizationHeader();

  if (!authorizationHeader || !paymentId) {
    return null;
  }

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: authorizationHeader,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
};

const verifyRazorpayPaymentSignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  const { keySecret } = getRazorpayConfig();

  if (!keySecret || !orderId || !paymentId || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const providedBuffer = Buffer.from(String(signature), "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const verifyRazorpayWebhookSignature = (rawBody, signature) => {
  const { webhookSecret } = getRazorpayConfig();

  if (!webhookSecret || !rawBody || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const providedBuffer = Buffer.from(String(signature), "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

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
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  getBearerToken,
  getMemberUnlock,
  getProductAmount,
  getProductById,
  getProductCurrency,
  getRazorpayConfig,
  getSupabaseConfig,
  readRawRequestBody,
  readRequestBody,
  sendJson,
  upsertMemberUnlock,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  verifySupabaseSession,
};
