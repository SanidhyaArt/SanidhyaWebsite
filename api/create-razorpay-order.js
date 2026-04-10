const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  createRazorpayOrder,
  getBearerToken,
  getProductAmount,
  getProductById,
  getProductCurrency,
  getRazorpayConfig,
  readRequestBody,
  sendJson,
  verifySupabaseSession,
} = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (
    !assertAllowedUserAgent(req, res) ||
    !assertSameSiteRequest(req, res) ||
    !assertRateLimit(req, res, { scope: "create-razorpay-order", limit: 20 })
  ) {
    return;
  }

  const user = await verifySupabaseSession(getBearerToken(req));

  if (!user?.id || !user?.email) {
    sendJson(res, 401, { error: "Please log in before purchasing." });
    return;
  }

  let payload = {};

  try {
    payload = await readRequestBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Invalid request body" });
    return;
  }

  const productId = String(payload.productId || "").trim();
  const product = getProductById(productId);

  if (!product) {
    sendJson(res, 404, { error: "Product not found" });
    return;
  }

  const razorpayConfig = getRazorpayConfig();

  if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
    const missingKeys = [];

    if (!razorpayConfig.keyId) {
      missingKeys.push("SANIDHYA_RAZORPAY_KEY_ID");
    }

    if (!razorpayConfig.keySecret) {
      missingKeys.push("SANIDHYA_RAZORPAY_KEY_SECRET");
    }

    sendJson(res, 503, {
      error: `Razorpay is not configured for this deployment yet. Missing: ${missingKeys.join(
        ", "
      )}. Runtime env: ${
        process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
      }.`,
    });
    return;
  }

  const amount = getProductAmount(product);
  const currency = getProductCurrency(product);

  if (!amount || !currency) {
    const missingPricing = [];

    if (!amount) {
      missingPricing.push(product.amountEnv);
    }

    sendJson(res, 503, {
      error: `This product is not connected to valid pricing yet. Missing: ${missingPricing.join(
        ", "
      )}. Runtime env: ${
        process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
      }.`,
    });
    return;
  }

  try {
    const order = await createRazorpayOrder({ product, user });

    if (!order?.id) {
      throw new Error("Razorpay did not return a valid order.");
    }

    sendJson(res, 200, {
      productId,
      keyId: razorpayConfig.keyId,
      order,
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        amount,
        currency,
      },
      user: {
        email: user.email || "",
      },
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Could not create a Razorpay order.",
    });
  }
};
