import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Fallback only if env is empty — change HOMS_STAFF_CODE in production. */
const FALLBACK = "Homs3369063";

export function staffSecret(): string {
  return (process.env.HOMS_STAFF_CODE ?? FALLBACK).replace(/\s+/g, "");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function pinMatches(pin: string) {
  const n = pin.replace(/\s+/g, "");
  return n.length >= 4 && safeEqual(n, staffSecret());
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Stable embed key — no disk. Changes only when HOMS_STAFF_CODE changes. */
export function stableLiveKey() {
  const digest = createHmac("sha256", staffSecret()).update("homs-live-v1").digest("hex");
  return `homs_live_${digest.slice(0, 36)}`;
}

export function extraLiveKeys(): string[] {
  return (process.env.HOMS_LIVE_KEYS ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
