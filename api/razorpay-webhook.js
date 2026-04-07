const {
  fetchRazorpayOrder,
  getProductById,
  readRawRequestBody,
  sendJson,
  upsertMemberUnlock,
  verifyRazorpayWebhookSignature,
} = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let rawBody = "";

  try {
    rawBody = await readRawRequestBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not read request body" });
    return;
  }

  if (
    !verifyRazorpayWebhookSignature(
      rawBody,
      req.headers["x-razorpay-signature"]
    )
  ) {
    sendJson(res, 400, { error: "Invalid webhook signature" });
    return;
  }

  let event;

  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    sendJson(res, 400, { error: "Invalid JSON payload" });
    return;
  }

  if (event.event !== "payment.captured") {
    sendJson(res, 200, { received: true, ignored: true });
    return;
  }

  const payment = event.payload?.payment?.entity || {};
  const orderId = String(payment.order_id || "").trim();
  const paymentId = String(payment.id || "").trim();

  if (!orderId || !paymentId) {
    sendJson(res, 200, { received: true, ignored: true });
    return;
  }

  const order = await fetchRazorpayOrder(orderId);

  if (!order) {
    sendJson(res, 200, { received: true, ignored: true });
    return;
  }

  const productId = String(order.notes?.product_id || "").trim();
  const userId = String(order.notes?.user_id || "").trim();
  const userEmail = String(order.notes?.user_email || "").trim();

  if (!getProductById(productId) || !userId) {
    sendJson(res, 200, { received: true, ignored: true });
    return;
  }

  const didUpsert = await upsertMemberUnlock({
    userId,
    userEmail,
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
    sendJson(res, 500, { error: "Could not persist purchase unlock" });
    return;
  }

  sendJson(res, 200, { received: true });
};
