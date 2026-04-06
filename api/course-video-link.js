const crypto = require("node:crypto");
const {
  assertAllowedUserAgent,
  assertRateLimit,
  assertSameSiteRequest,
  sendJson,
} = require("./_freebies-security");

const signedUrlTtlSeconds = 5 * 60;

const courseVideoCatalog = {
  "design-intro": {
    title: "Design Course Intro",
    objectKey: "courses/design-intro.mp4",
  },
};

const getSupabaseConfig = () => ({
  url: String(
    process.env.SANIDHYA_SUPABASE_URL ||
      "https://cuuutlobfwetrtnrcela.supabase.co"
  ).trim(),
  anonKey: String(
    process.env.SANIDHYA_SUPABASE_ANON_KEY ||
      "sb_publishable_IhLdTf5ckrSHsafKWBB1rw_5-z4myWu"
  ).trim(),
});

const getR2Config = () => ({
  accountId: String(process.env.SANIDHYA_R2_ACCOUNT_ID || "").trim(),
  accessKeyId: String(process.env.SANIDHYA_R2_ACCESS_KEY_ID || "").trim(),
  secretAccessKey: String(process.env.SANIDHYA_R2_SECRET_ACCESS_KEY || "").trim(),
  bucketName: String(process.env.SANIDHYA_R2_BUCKET_NAME || "").trim(),
});

const getBearerToken = (req) => {
  const authorizationHeader = String(req.headers.authorization || "").trim();

  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorizationHeader.slice(7).trim();
};

const verifySupabaseSession = async (accessToken) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !accessToken) {
    return null;
  }

  const authResponse = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!authResponse.ok) {
    return null;
  }

  return authResponse.json();
};

const toAmzDate = (date) =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, "");

const createHmac = (key, value, encoding) =>
  crypto.createHmac("sha256", key).update(value).digest(encoding);

const sha256Hex = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const encodeObjectPath = (objectKey) =>
  objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const getSigningKey = (secretAccessKey, dateStamp) => {
  const dateKey = createHmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = createHmac(dateKey, "auto");
  const serviceKey = createHmac(regionKey, "s3");
  return createHmac(serviceKey, "aws4_request");
};

const createR2SignedGetUrl = (objectKey) => {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = getR2Config();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  const signedAt = new Date();
  const amzDate = toAmzDate(signedAt);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const host = `${bucketName}.${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeObjectPath(objectKey)}`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(signedUrlTtlSeconds),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalQuery = Array.from(queryParams.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuery,
    `host:${host}`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = createHmac(
    getSigningKey(secretAccessKey, dateStamp),
    stringToSign,
    "hex"
  );

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
};

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (
    !assertAllowedUserAgent(req, res) ||
    !assertSameSiteRequest(req, res) ||
    !assertRateLimit(req, res, { scope: "course-video-link", limit: 60 })
  ) {
    return;
  }

  const lessonId = String(req.query?.lesson || "").trim();
  const courseVideo = courseVideoCatalog[lessonId];

  if (!courseVideo) {
    sendJson(res, 404, { error: "Course video not found" });
    return;
  }

  const user = await verifySupabaseSession(getBearerToken(req));

  if (!user?.id) {
    sendJson(res, 401, { error: "Please log in to access this lesson." });
    return;
  }

  const videoUrl = createR2SignedGetUrl(courseVideo.objectKey);

  if (!videoUrl) {
    sendJson(res, 503, {
      error:
        "R2 is not configured yet. Add your Standard bucket credentials in Vercel environment variables.",
    });
    return;
  }

  sendJson(res, 200, {
    lessonId,
    title: courseVideo.title,
    videoUrl,
    expiresIn: signedUrlTtlSeconds,
  });
};
