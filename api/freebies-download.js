const {
  assertAllowedUserAgent,
  assertRateLimit,
  sendJson,
  verifySignedAccessCookie,
  verifySignedDownloadRequest,
} = require("./_freebies-security");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (
    !assertAllowedUserAgent(req, res) ||
    !assertRateLimit(req, res, { scope: "freebies-download", limit: 80 })
  ) {
    return;
  }

  if (!verifySignedAccessCookie(req)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  const freebie = verifySignedDownloadRequest(req);

  if (!freebie) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", freebie.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${freebie.filename}"`
  );
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.end(freebie.body);
};
