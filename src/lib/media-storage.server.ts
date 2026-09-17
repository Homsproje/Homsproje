/**
 * Provider-agnostic media persistence layer (Stage-1).
 *
 * Problem:
 * - xAI (and most image/video APIs) return short-lived URLs or base64.
 * - Converting everything to data: URLs blows up localStorage / browser memory
 *   and is not suitable for multi-user production.
 *
 * Solution (prepared here):
 * - Callers use `persistMedia(urlOrBytes)`.
 * - When a real storage backend is configured (R2 / S3 / Vercel Blob),
 *   the result is a durable HTTPS URL.
 * - Until then we keep the current safe fallback (data URL for small assets,
 *   original URL otherwise) so the Studio continues to work.
 *
 * No storage credentials are hard-coded. Configure later via env:
 *   HOMS_MEDIA_PROVIDER=r2|s3|blob|none
 *   + corresponding provider secrets.
 */

export type MediaPersistResult =
  | { ok: true; url: string; durable: boolean }
  | { ok: false; error: string };

const MAX_INLINE_BYTES = 2_400_000; // keep parity with previous xAI helper

function mediaProvider(): string {
  return (process.env.HOMS_MEDIA_PROVIDER ?? "none").trim().toLowerCase();
}

/**
 * Persist a remote or data: URL into durable storage when configured.
 * Falls back gracefully when no backend is set.
 */
export async function persistMedia(sourceUrl: string): Promise<MediaPersistResult> {
  if (!sourceUrl || typeof sourceUrl !== "string") {
    return { ok: false, error: "Geçersiz medya adresi." };
  }

  // Already durable data URL or known durable host — leave as-is for now.
  if (sourceUrl.startsWith("data:")) {
    return { ok: true, url: sourceUrl, durable: false };
  }

  const provider = mediaProvider();

  // Future: real providers
  if (provider === "r2" || provider === "s3" || provider === "blob") {
    // Intentionally not implemented in Stage-1.
    // When secrets are present, implement upload here and return durable URL.
    // For now fall through to the safe default so production is never broken.
  }

  // Safe default (current behaviour): try to inline small assets as data URLs.
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      // Keep the original temporary URL rather than fail the generation.
      return { ok: true, url: sourceUrl, durable: false };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
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

/** Convenience for callers that already have bytes. */
export async function persistBytes(
  bytes: Buffer | Uint8Array,
  mime = "application/octet-stream",
): Promise<MediaPersistResult> {
  const provider = mediaProvider();
  if (provider === "r2" || provider === "s3" || provider === "blob") {
    // Future upload path.
  }
  if (bytes.byteLength > MAX_INLINE_BYTES) {
    return { ok: false, error: "Dosya çok büyük (inline limit)." };
  }
  const b64 = Buffer.from(bytes).toString("base64");
  return { ok: true, url: `data:${mime};base64,${b64}`, durable: false };
}
