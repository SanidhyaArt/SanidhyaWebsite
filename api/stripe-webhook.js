const {
  getProductById,
  readRawRequestBody,
  sendJson,
  upsertMemberUnlock,
  verifyStripeSignature,
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

  if (!verifyStripeSignature(rawBody, req.headers["stripe-signature"])) {
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

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    sendJson(res, 200, { received: true, ignored: true });
    return;
  }

  const checkoutSession = event.data?.object || {};
  const productId = String(checkoutSession.metadata?.product_id || "").trim();
  const userId = String(
    checkoutSession.metadata?.user_id || checkoutSession.client_reference_id || ""
  ).trim();
  const userEmail = String(
    checkoutSession.metadata?.user_email || checkoutSession.customer_details?.email || checkoutSession.customer_email || ""
  ).trim();

  if (
    checkoutSession.payment_status !== "paid" ||
    !getProductById(productId) ||
    !userId
  ) {
    sendJson(res, 200, { received: true, ignored: true });
    return;
  }

  const didUpsert = await upsertMemberUnlock({
    userId,
    userEmail,
    productId,
    provider: "stripe",
    providerReference: String(checkoutSession.id || "").trim(),
    metadata: {
      amount_total: checkoutSession.amount_total || null,
      currency: checkoutSession.currency || null,
      customer: checkoutSession.customer || null,
      payment_status: checkoutSession.payment_status || null,
    },
  });

  if (!didUpsert) {
    sendJson(res, 500, { error: "Could not persist member unlock" });
    return;
  }

  sendJson(res, 200, { received: true });
};
