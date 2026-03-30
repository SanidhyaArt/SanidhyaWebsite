module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    let payload = {};

    try {
      payload = body ? JSON.parse(body) : {};
    } catch (error) {
      payload = { parseError: true };
    }

    console.info(
      JSON.stringify({
        type: "site_event",
        receivedAt: new Date().toISOString(),
        country: String(req.headers["x-vercel-ip-country"] || "").toUpperCase(),
        userAgent: req.headers["user-agent"] || "",
        ...payload,
      })
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.statusCode = 204;
    res.end();
  });
};
