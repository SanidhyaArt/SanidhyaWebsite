const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  createSignedDownloadUrl,
  freebieCatalog,
  sendJson,
  verifySignedAccessCookie,
} = require("./_freebies-security");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (
    !assertAllowedUserAgent(req, res) ||
    !assertSameSiteRequest(req, res) ||
    !assertRateLimit(req, res, { scope: "freebies-links", limit: 60 })
  ) {
    return;
  }

  if (!verifySignedAccessCookie(req)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  sendJson(res, 200, {
    files: Object.keys(freebieCatalog).map((fileId) => ({
      id: fileId,
      href: createSignedDownloadUrl(fileId),
    })),
  });
};
