/**
 * Provider-agnostic media persistence layer.
 *
 * Stage-2: structure ready for Cloudflare R2 / S3 / Vercel Blob.
 * When HOMS_MEDIA_PROVIDER is set and credentials exist, uploads go there.
 * Otherwise falls back to data-URL / temporary URL (Studio keeps working).
 *
 * Secrets (server-only):
 *   HOMS_MEDIA_PROVIDER=r2|s3|blob|none
 *   HOMS_MEDIA_BUCKET=
 *   HOMS_MEDIA_ACCESS_KEY_ID=
 *   HOMS_MEDIA_SECRET_ACCESS_KEY=
 *   HOMS_MEDIA_ENDPOINT=          (R2: https://<accountid>.r2.cloudflarestorage.com)
 *   HOMS_MEDIA_PUBLIC_BASE_URL=   (optional CDN / public bucket URL)
 *   HOMS_MEDIA_REGION=auto
 */

export type MediaPersistResult =
  | { ok: true; url: string; durable: boolean; storageKey?: string }
  | { ok: false; error: string };

const MAX_INLINE_BYTES = 2_400_000;

function mediaProvider(): string {
  return (process.env.HOMS_MEDIA_PROVIDER ?? "none").trim().toLowerCase();
}

function r2Configured(): boolean {
  return Boolean(
    process.env.HOMS_MEDIA_BUCKET?.trim() &&
      process.env.HOMS_MEDIA_ACCESS_KEY_ID?.trim() &&
      process.env.HOMS_MEDIA_SECRET_ACCESS_KEY?.trim() &&
      process.env.HOMS_MEDIA_ENDPOINT?.trim(),
  );
}

/**
 * Upload bytes to S3-compatible storage when configured.
 * Returns public or path-style URL + storage key.
 * Implementation is intentionally minimal — no AWS SDK dependency yet;
 * uses fetch + AWS SigV4 can be added when secrets are present in production.
 */
async function uploadToObjectStore(
  bytes: Buffer,
  mime: string,
  keyHint?: string,
): Promise<MediaPersistResult> {
  // Placeholder path: Stage-2 prepares the contract. Full SigV4 upload lands
  // when production secrets are provisioned (avoids shipping half-working SDK).
  if (!r2Configured()) {
    return { ok: false, error: "Object storage yapılandırılmamış." };
  }
  const bucket = process.env.HOMS_MEDIA_BUCKET!.trim();
  const publicBase = process.env.HOMS_MEDIA_PUBLIC_BASE_URL?.trim();
  const key = keyHint || `homs/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // Without a signed PUT implementation we refuse rather than silently data-URL
  // large production assets. Callers fall back below.
  void bytes;
  void mime;
  void bucket;
  void publicBase;
  return {
    ok: false,
    error: "Object storage imzalı yükleme henüz etkin değil (credentials hazır, SDK sırada).",
  };
}

/**
 * Persist a remote or data: URL into durable storage when configured.
 * Falls back gracefully when no backend is set.
 */
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

    if ((provider === "r2" || provider === "s3" || provider === "blob") && r2Configured()) {
      const uploaded = await uploadToObjectStore(buf, mime);
      if (uploaded.ok) return uploaded;
      // fall through to inline / temp URL
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

  if ((provider === "r2" || provider === "s3" || provider === "blob") && r2Configured()) {
    const uploaded = await uploadToObjectStore(buf, mime, keyHint);
    if (uploaded.ok) return uploaded;
  }

  if (buf.byteLength > MAX_INLINE_BYTES) {
    return { ok: false, error: "Dosya çok büyük (inline limit)." };
  }
  return { ok: true, url: `data:${mime};base64,${buf.toString("base64")}`, durable: false };
}
