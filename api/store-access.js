const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  getBearerToken,
  getMemberUnlock,
  getProductById,
  sendJson,
  verifySupabaseSession,
} = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (
    !assertAllowedUserAgent(req, res) ||
    !assertSameSiteRequest(req, res) ||
    !assertRateLimit(req, res, { scope: "store-access", limit: 90 })
  ) {
    return;
  }

  const productId = String(req.query?.product || "").trim();
  const product = getProductById(productId);

  if (!product) {
    sendJson(res, 404, { error: "Product not found" });
    return;
  }

  const user = await verifySupabaseSession(getBearerToken(req));

  if (!user?.id) {
    sendJson(res, 200, {
      authenticated: false,
      hasAccess: false,
      productId,
    });
    return;
  }

  const unlock = await getMemberUnlock({ userId: user.id, productId });

  sendJson(res, 200, {
    authenticated: true,
    hasAccess: Boolean(unlock),
    productId,
    unlock: unlock || null,
  });
};
