import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Staff secret (HOMS_STAFF_CODE).
 * Must be provided via environment in production.
 * Never embed a default secret in source code.
 */
export function staffSecret(): string {
  const raw = process.env.HOMS_STAFF_CODE?.replace(/\s+/g, "") ?? "";
  return raw;
}

/** True when a usable staff code is configured. */
export function staffSecretConfigured(): boolean {
  return staffSecret().length >= 4;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function pinMatches(pin: string) {
  const secret = staffSecret();
  if (secret.length < 4) return false; // misconfigured environment
  const n = pin.replace(/\s+/g, "");
  return n.length >= 4 && safeEqual(n, secret);
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Stable embed key — derived only from HOMS_STAFF_CODE.
 * Changes only when the env secret changes. No disk writes.
 */
export function stableLiveKey() {
  const secret = staffSecret();
  if (secret.length < 4) {
    // Misconfigured: return a non-functional placeholder so callers fail closed.
    return "homs_live_unconfigured";
  }
  const digest = createHmac("sha256", secret).update("homs-live-v1").digest("hex");
  return `homs_live_${digest.slice(0, 36)}`;
}

export function extraLiveKeys(): string[] {
  return (process.env.HOMS_LIVE_KEYS ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
