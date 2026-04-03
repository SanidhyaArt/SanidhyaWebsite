const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  clearAccessCookie,
  getConfiguredPassword,
  readRequestBody,
  sendJson,
  setAccessCookie,
} = require("./_freebies-security");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (
    !assertAllowedUserAgent(req, res) ||
    !assertSameSiteRequest(req, res) ||
    !assertRateLimit(req, res, { scope: "freebies-auth", limit: 12 })
  ) {
    return;
  }

  let payload = {};

  try {
    payload = await readRequestBody(req);
  } catch (error) {
    clearAccessCookie(res);
    sendJson(res, 400, { error: "Invalid request" });
    return;
  }

  const submittedPassword = String(payload.password || "")
    .trim()
    .toLowerCase();

  if (!submittedPassword || submittedPassword !== getConfiguredPassword()) {
    clearAccessCookie(res);
    sendJson(res, 403, { error: "Invalid password" });
    return;
  }

  setAccessCookie(res);
  sendJson(res, 200, {
    ok: true,
    redirect: "/hidden",
  });
};
