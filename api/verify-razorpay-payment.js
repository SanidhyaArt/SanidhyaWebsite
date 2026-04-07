const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  getBearerToken,
  getProductById,
  readRequestBody,
  sendJson,
  upsertMemberUnlock,
  verifyRazorpayPaymentSignature,
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
    !assertRateLimit(req, res, { scope: "verify-razorpay-payment", limit: 30 })
  ) {
    return;
  }

  const user = await verifySupabaseSession(getBearerToken(req));

  if (!user?.id || !user?.email) {
    sendJson(res, 401, { error: "Please log in before verifying payment." });
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
  const orderId = String(payload.razorpay_order_id || "").trim();
  const paymentId = String(payload.razorpay_payment_id || "").trim();
  const signature = String(payload.razorpay_signature || "").trim();
  const product = getProductById(productId);

  if (!product || !orderId || !paymentId || !signature) {
    sendJson(res, 400, { error: "Missing payment verification details." });
    return;
  }

  if (
    !verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
    })
  ) {
    sendJson(res, 400, { error: "Invalid payment signature." });
    return;
  }

  const [order, payment] = await Promise.all([
    fetchRazorpayOrder(orderId),
    fetchRazorpayPayment(paymentId),
  ]);

  if (!order || !payment) {
    sendJson(res, 400, { error: "Could not validate this Razorpay payment." });
    return;
  }

  const orderUserId = String(order.notes?.user_id || "").trim();
  const orderProductId = String(order.notes?.product_id || "").trim();
  const paymentStatus = String(payment.status || "").trim().toLowerCase();

  if (
    orderUserId !== user.id ||
    orderProductId !== productId ||
    String(payment.order_id || "").trim() !== orderId
  ) {
    sendJson(res, 403, { error: "This payment does not match your account." });
    return;
  }

  if (!["authorized", "captured"].includes(paymentStatus)) {
    sendJson(res, 400, {
      error: "Payment is not yet in a successful state.",
    });
    return;
  }

  const didUpsert = await upsertMemberUnlock({
    userId: user.id,
    userEmail: user.email,
    productId,
    provider: "razorpay",
    providerReference: paymentId,
    metadata: {
      order_id: orderId,
      payment_id: paymentId,
      payment_status: payment.status || null,
      amount: payment.amount || null,
      currency: payment.currency || null,
      method: payment.method || null,
    },
  });

  if (!didUpsert) {
    sendJson(res, 500, { error: "Could not activate your purchase." });
    return;
  }

  sendJson(res, 200, {
    productId,
    hasAccess: true,
    paymentStatus,
  });
};
