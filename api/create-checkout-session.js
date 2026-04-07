const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  createStripeCheckoutSession,
  getBearerToken,
  getProductById,
  getStripePriceIdForProduct,
  getStripeConfig,
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
    !assertRateLimit(req, res, { scope: "create-checkout-session", limit: 20 })
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

  if (!getStripeConfig().secretKey) {
    sendJson(res, 503, {
      error: "Stripe is not configured yet. Add your Stripe secret key in Vercel environment variables.",
    });
    return;
  }

  if (!getStripePriceIdForProduct(product)) {
    sendJson(res, 503, {
      error: "This product is not connected to a Stripe price yet.",
    });
    return;
  }

  try {
    const checkoutSession = await createStripeCheckoutSession({
      req,
      product,
      user,
    });

    if (!checkoutSession?.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    sendJson(res, 200, {
      productId,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id || "",
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Could not create a checkout session.",
    });
  }
};
