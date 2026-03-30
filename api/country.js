module.exports = (req, res) => {
  const country = String(req.headers["x-vercel-ip-country"] || "").toUpperCase();

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.statusCode = 200;
  res.end(JSON.stringify({ country }));
};
