const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const accessCookieName = "sanidhya_freebies_access";
const accessTtlSeconds = 15 * 60;
const downloadTtlSeconds = 5 * 60;
const maxBodyBytes = 12 * 1024;
const rateWindowMs = 60 * 1000;
const botUserAgentPattern =
  /\b(curl|wget|python-requests|httpclient|scrapy|headlesschrome|phantomjs|bot|spider|crawler)\b/i;

const requestBuckets = new Map();

const protectedFreebiesDirectory = path.join(process.cwd(), "protected-freebies");

const freebieCatalog = {
  "creative-brief-template": {
    filename: "creative-brief-template.md",
    contentType: "text/markdown; charset=utf-8",
    filePath: path.join(protectedFreebiesDirectory, "creative-brief-template.md"),
  },
  "brand-audit-checklist": {
    filename: "brand-audit-checklist.md",
    contentType: "text/markdown; charset=utf-8",
    filePath: path.join(protectedFreebiesDirectory, "brand-audit-checklist.md"),
  },
  "presentation-framework": {
    filename: "presentation-framework.md",
    contentType: "text/markdown; charset=utf-8",
    filePath: path.join(protectedFreebiesDirectory, "presentation-framework.md"),
  },
  "launch-asset-checklist": {
    filename: "launch-asset-checklist.md",
    contentType: "text/markdown; charset=utf-8",
    filePath: path.join(protectedFreebiesDirectory, "launch-asset-checklist.md"),
  },
};

const resolveFreebiePayload = (freebie) => {
  if (!freebie) {
    return null;
  }

  if (freebie.filePath && fs.existsSync(freebie.filePath)) {
    return {
      ...freebie,
      body: fs.readFileSync(freebie.filePath),
    };
  }

  if (typeof freebie.body === "string") {
    return {
      ...freebie,
      body: Buffer.from(freebie.body, "utf8"),
    };
  }

  return null;
};

const getConfiguredPassword = () =>
  String(process.env.SANIDHYA_FREEBIES_PASSWORD || "sanidhya26")
    .trim()
    .toLowerCase();

const getSigningSecret = () =>
  String(process.env.SANIDHYA_FREEBIES_SECRET || "sanidhya-local-freebies-secret");

const sendJson = (res, statusCode, payload = {}) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(statusCode === 204 ? "" : JSON.stringify(payload));
};

const getClientIp = (req) => {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();

  return (
    forwardedFor ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
};

const isDisallowedUserAgent = (req) => {
  const userAgent = String(req.headers["user-agent"] || "").trim();
  return !userAgent || botUserAgentPattern.test(userAgent);
};

const assertAllowedUserAgent = (req, res) => {
  if (!isDisallowedUserAgent(req)) {
    return true;
  }

  sendJson(res, 403, { error: "Forbidden" });
  return false;
};

const assertRateLimit = (req, res, { scope, limit }) => {
  const now = Date.now();
  const key = `${scope}:${getClientIp(req)}`;
  const bucket = requestBuckets.get(key) || { count: 0, resetAt: now + rateWindowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + rateWindowMs;
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);

  if (bucket.count <= limit) {
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(limit - bucket.count, 0)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    return true;
  }

  sendJson(res, 429, { error: "Too many requests" });
  return false;
};

const getRequestHost = (req) =>
  String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

const isSameSiteRequest = (req) => {
  const requestHost = getRequestHost(req);

  if (!requestHost) {
    return false;
  }

  const sourceHeader = String(req.headers.origin || req.headers.referer || "").trim();

  if (!sourceHeader) {
    return false;
  }

  try {
    return new URL(sourceHeader).host.toLowerCase() === requestHost;
  } catch (error) {
    return false;
  }
};

const assertSameSiteRequest = (req, res) => {
  if (isSameSiteRequest(req)) {
    return true;
  }

  sendJson(res, 403, { error: "Forbidden" });
  return false;
};

const signValue = (value) =>
  crypto.createHmac("sha256", getSigningSecret()).update(value).digest("base64url");

const toBase64Payload = (payload) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const fromBase64Payload = (encodedPayload) =>
  JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

const createSignedAccessCookie = () => {
  const payload = {
    scope: "freebies",
    exp: Math.floor(Date.now() / 1000) + accessTtlSeconds,
  };
  const encodedPayload = toBase64Payload(payload);
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

const verifySignedAccessCookie = (req) => {
  const cookieHeader = String(req.headers.cookie || "");
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookiePair) => cookiePair.trim())
      .filter(Boolean)
      .map((cookiePair) => {
        const separatorIndex = cookiePair.indexOf("=");
        return separatorIndex === -1
          ? [cookiePair, ""]
          : [
              cookiePair.slice(0, separatorIndex),
              cookiePair.slice(separatorIndex + 1),
            ];
      })
  );
  const cookieValue = cookies[accessCookieName];

  if (!cookieValue) {
    return false;
  }

  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signValue(encodedPayload);
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    return false;
  }

  try {
    const payload = fromBase64Payload(encodedPayload);
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.scope === "freebies" && Number(payload.exp) >= nowSeconds;
  } catch (error) {
    return false;
  }
};

const setAccessCookie = (res) => {
  res.setHeader(
    "Set-Cookie",
    `${accessCookieName}=${createSignedAccessCookie()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${accessTtlSeconds}`
  );
};

const clearAccessCookie = (res) => {
  res.setHeader(
    "Set-Cookie",
    `${accessCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
};

const createSignedDownloadUrl = (freebieId) => {
  const expiresAt = Math.floor(Date.now() / 1000) + downloadTtlSeconds;
  const signature = signValue(`${freebieId}:${expiresAt}`);
  const query = new URLSearchParams({
    file: freebieId,
    exp: String(expiresAt),
    sig: signature,
  });

  return `/api/freebies-download?${query.toString()}`;
};

const verifySignedDownloadRequest = (req) => {
  const fileId = String(req.query?.file || "").trim();
  const expiresAt = Number(req.query?.exp || 0);
  const signature = String(req.query?.sig || "");
  const freebie = freebieCatalog[fileId];

  if (!freebie || !Number.isFinite(expiresAt) || !signature) {
    return null;
  }

  if (expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expectedSignature = signValue(`${fileId}:${expiresAt}`);
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    return null;
  }

  const resolvedFreebie = resolveFreebiePayload(freebie);

  if (!resolvedFreebie) {
    return null;
  }

  return {
    fileId,
    ...resolvedFreebie,
  };
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body, "utf8") > maxBodyBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });

module.exports = {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  clearAccessCookie,
  createSignedDownloadUrl,
  freebieCatalog,
  getConfiguredPassword,
  readRequestBody,
  sendJson,
  setAccessCookie,
  verifySignedAccessCookie,
  verifySignedDownloadRequest,
};
