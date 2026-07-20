/**
 * Cloudflare R2 upload with AWS Signature V4 (path-style).
 * Zero-dependency — pure crypto + fetch.
 *
 * URL path: https://<accountid>.r2.cloudflarestorage.com/<bucket>/<key>
 * Canonical URI must match the URL path for the signature to validate.
 */

import { createHash, createHmac, randomBytes } from "crypto";

// ---- Helpers ----

function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function hmacSha256Hex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

/**
 * URI-encode a path segment per AWS SigV4 rules.
 * encodeURIComponent covers most cases; we also encode ! * ' ( )
 * which encodeURIComponent leaves unencoded but AWS requires encoded.
 */
function uriEncodePath(segment: string): string {
  return encodeURIComponent(segment).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/**
 * Upload image bytes to R2 and return the public URL.
 */
export async function uploadToR2(
  imageBytes: Buffer,
  filename: string,
  contentType: string = "image/png"
): Promise<string> {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;      // e.g. https://<id>.r2.cloudflarestorage.com
  const publicUrl = process.env.R2_PUBLIC_URL;    // e.g. https://pub-xxx.r2.dev

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint || !publicUrl) {
    throw new Error("R2 env vars not set");
  }

  const baseEndpoint = endpoint.replace(/\/+$/, "");
  const region = "auto";
  const service = "s3";

  // ---- Build canonical path (includes bucket) ----
  const objectKey = `images/${filename}`;
  const s3Path = `${bucket}/${objectKey}`;
  const canonicalUri = "/" + s3Path
    .split("/")
    .map(uriEncodePath)
    .join("/");

  // ---- Signing metadata ----
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(imageBytes);
  const host = new URL(baseEndpoint).host;

  // Headers (sorted lowercase for canonicalization)
  const headers: Record<string, string> = {
    "content-type": contentType,
    "host": host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const signedHeaders = Object.keys(headers).sort().join(";");

  // Canonical headers
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${headers[k].trim()}`)
    .join("\n");

  // ---- Canonical request (CRITICAL: canonicalUri must match URL path) ----
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "", // no query string
    canonicalHeaders + "\n",
    signedHeaders,
    payloadHash,
  ].join("\n");

  // String to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  // Signing key
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");

  const signature = hmacSha256Hex(kSigning, stringToSign);

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  // ---- Execute PUT (URL matches canonicalUri) ----
  const uploadUrl = `${baseEndpoint}/${s3Path}`;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
      Authorization: authorization,
    },
    body: imageBytes as unknown as BodyInit,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload failed ${response.status}: ${text.slice(0, 200)}`);
  }

  return `${publicUrl.replace(/\/+$/, "")}/${objectKey}`;
}

/**
 * Generate a unique filename for R2 upload.
 */
export function generateFilename(seed: number): string {
  const ts = Date.now();
  const rand = randomBytes(4).toString("hex");
  return `${ts}-${seed}-${rand}.png`;
}
