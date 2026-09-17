/**
 * Provider-agnostic media persistence.
 *
 * HOMS_MEDIA_PROVIDER=r2|s3  + credentials → durable object storage (SigV4 PUT).
 * HOMS_MEDIA_PROVIDER=none (default) → data-URL / temporary URL fallback.
 *
 * Never reports durable success without a successful upload response.
 *
 * Env (server-only):
 *   HOMS_MEDIA_PROVIDER=r2|s3|none
 *   HOMS_MEDIA_BUCKET=
 *   HOMS_MEDIA_ACCESS_KEY_ID=
 *   HOMS_MEDIA_SECRET_ACCESS_KEY=
 *   HOMS_MEDIA_ENDPOINT=   (R2: https://<accountid>.r2.cloudflarestorage.com)
 *   HOMS_MEDIA_PUBLIC_BASE_URL=
 *   HOMS_MEDIA_REGION=auto
 */

import { createHash, createHmac } from "node:crypto";

export type MediaPersistResult =
  | { ok: true; url: string; durable: boolean; storageKey?: string }
  | { ok: false; error: string };

const MAX_INLINE_BYTES = 2_400_000;
const MAX_OBJECT_BYTES = 40_000_000;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/octet-stream",
]);

function mediaProvider(): string {
  return (process.env.HOMS_MEDIA_PROVIDER ?? "none").trim().toLowerCase();
}

function objectStoreConfigured(): boolean {
  return Boolean(
    process.env.HOMS_MEDIA_BUCKET?.trim() &&
      process.env.HOMS_MEDIA_ACCESS_KEY_ID?.trim() &&
      process.env.HOMS_MEDIA_SECRET_ACCESS_KEY?.trim() &&
      process.env.HOMS_MEDIA_ENDPOINT?.trim(),
  );
}

function safeKey(hint?: string): string {
  const base = hint?.replace(/[^a-zA-Z0-9._/-]/g, "_").slice(0, 180) || "asset";
  const stamp = `${Date.now()}-${createHash("sha256").update(String(Math.random())).digest("hex").slice(0, 12)}`;
  return `homs/${stamp}/${base}`;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** AWS Signature Version 4 for S3-compatible PUT (R2 / S3). */
async function signedPut(opts: {
  endpoint: string;
  region: string;
  bucket: string;
  key: string;
  body: Buffer;
  mime: string;
  accessKeyId: string;
  secretAccessKey: string;
}): Promise<{ ok: true; status: number } | { ok: false; error: string }> {
  const url = new URL(opts.endpoint.replace(/\/$/, "") + `/${opts.bucket}/${opts.key}`);
  const host = url.host;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(opts.body);
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${opts.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const kDate = hmac(`AWS4${opts.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, opts.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        Host: host,
        "Content-Type": opts.mime,
        "Content-Length": String(opts.body.byteLength),
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authorization,
      },
      body: opts.body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Storage upload failed (${res.status}): ${text.slice(0, 200)}` };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Upload network error" };
  }
}

async function uploadToObjectStore(
  bytes: Buffer,
  mime: string,
  keyHint?: string,
): Promise<MediaPersistResult> {
  if (!objectStoreConfigured()) {
    return { ok: false, error: "Object storage yapılandırılmamış (credentials eksik)." };
  }
  if (bytes.byteLength > MAX_OBJECT_BYTES) {
    return { ok: false, error: "Dosya çok büyük." };
  }
  const safeMime = ALLOWED_MIME.has(mime) ? mime : "application/octet-stream";
  const bucket = process.env.HOMS_MEDIA_BUCKET!.trim();
  const endpoint = process.env.HOMS_MEDIA_ENDPOINT!.trim();
  const accessKeyId = process.env.HOMS_MEDIA_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.HOMS_MEDIA_SECRET_ACCESS_KEY!.trim();
  const region = (process.env.HOMS_MEDIA_REGION ?? "auto").trim() || "auto";
  const publicBase = process.env.HOMS_MEDIA_PUBLIC_BASE_URL?.trim();
  const key = safeKey(keyHint);

  const put = await signedPut({
    endpoint,
    region,
    bucket,
    key,
    body: bytes,
    mime: safeMime,
    accessKeyId,
    secretAccessKey,
  });
  if (!put.ok) return { ok: false, error: put.error };

  const url = publicBase
    ? `${publicBase.replace(/\/$/, "")}/${key}`
    : `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;

  return { ok: true, url, durable: true, storageKey: key };
}

export async function persistMedia(sourceUrl: string): Promise<MediaPersistResult> {
  if (!sourceUrl || typeof sourceUrl !== "string") {
    return { ok: false, error: "Geçersiz medya adresi." };
  }

  if (sourceUrl.startsWith("data:")) {
    return { ok: true, url: sourceUrl, durable: false };
  }

  const provider = mediaProvider();

  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      return { ok: true, url: sourceUrl, durable: false };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0] || "application/octet-stream";

    if ((provider === "r2" || provider === "s3") && objectStoreConfigured()) {
      const uploaded = await uploadToObjectStore(buf, mime);
      if (uploaded.ok) return uploaded;
      // Do not invent durable URLs — fall back to temp/source.
    }

    if (buf.byteLength > MAX_INLINE_BYTES) {
      return { ok: true, url: sourceUrl, durable: false };
    }
    return {
      ok: true,
      url: `data:${mime};base64,${buf.toString("base64")}`,
      durable: false,
    };
  } catch {
    return { ok: true, url: sourceUrl, durable: false };
  }
}

export async function persistBytes(
  bytes: Buffer | Uint8Array,
  mime = "application/octet-stream",
  keyHint?: string,
): Promise<MediaPersistResult> {
  const provider = mediaProvider();
  const buf = Buffer.from(bytes);

  if ((provider === "r2" || provider === "s3") && objectStoreConfigured()) {
    return uploadToObjectStore(buf, mime, keyHint);
  }

  if (buf.byteLength > MAX_INLINE_BYTES) {
    return { ok: false, error: "Dosya çok büyük (inline limit)." };
  }
  return { ok: true, url: `data:${mime};base64,${buf.toString("base64")}`, durable: false };
}
