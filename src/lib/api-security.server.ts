import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  extraLiveKeys,
  hashValue,
  pinMatches,
  staffSecret,
  stableLiveKey,
} from "@/lib/staff-secret.server";

export type SecFile = {
  keyHashes: string[];
  origins: string[];
  rpm: number;
};

const FILE = join(process.cwd(), "data", "homs-security.json");

/** In-memory rate-limit counters (process-local; acceptable for serverless). */
const hits = new Map<string, { n: number; t: number }>();

/** In-memory security overrides when FS is unavailable (Vercel etc.). */
let memorySec: SecFile | null = null;

export const hash = hashValue;

function defaultSec(): SecFile {
  // Env can override defaults without touching disk.
  const envOrigins = (process.env.HOMS_API_ORIGINS ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const envRpm = Number(process.env.HOMS_API_RPM || "");
  return {
    keyHashes: [],
    origins:
      envOrigins.length > 0
        ? envOrigins
        : ["https://homsproje.com", "https://www.homsproje.com"],
    rpm: Number.isFinite(envRpm) && envRpm >= 5 && envRpm <= 120 ? envRpm : 30,
  };
}

export function load(): SecFile {
  if (memorySec) return { ...memorySec };
  try {
    if (!existsSync(FILE)) return defaultSec();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as SecFile;
    // Merge with defaults so missing fields never break production.
    const base = defaultSec();
    return {
      keyHashes: Array.isArray(parsed.keyHashes) ? parsed.keyHashes : [],
      origins: Array.isArray(parsed.origins) && parsed.origins.length > 0 ? parsed.origins : base.origins,
      rpm: typeof parsed.rpm === "number" ? parsed.rpm : base.rpm,
    };
  } catch {
    return defaultSec();
  }
}

export function save(data: SecFile) {
  // Always keep an in-memory copy so the current process sees updates
  // even when the filesystem is read-only (typical on Vercel).
  memorySec = { ...data };
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {
    /* serverless fs may be read-only — memorySec still holds the value */
  }
}

export function staffOk(pin: string) {
  return pinMatches(pin);
}

export function tokenOk(token: string) {
  const t = token.replace(/\s+/g, "");
  if (pinMatches(t)) return true;
  if (t === stableLiveKey()) return true;
  if (extraLiveKeys().includes(t)) return true;
  return load().keyHashes.includes(hash(t));
}

export function originOk(origin?: string | null) {
  if (!origin) return true;
  const allow = load().origins;
  if (!allow.length) return true;
  try {
    const host = new URL(origin).host.replace(/^www\./, "");
    if (host.endsWith("homsproje.com")) return true;
    return allow.some((o) => {
      try {
        return new URL(o).host.replace(/^www\./, "") === host;
      } catch {
        return o.includes(host);
      }
    });
  } catch {
    return false;
  }
}

export function rateOk(token: string) {
  const rpm = Math.max(5, Math.min(120, load().rpm || 30));
  const now = Date.now();
  const slot = `${hash(token)}:${Math.floor(now / 60_000)}`;
  const cur = hits.get(slot);
  if (!cur || now - cur.t > 60_000) {
    hits.set(slot, { n: 1, t: now });
    return true;
  }
  if (cur.n >= rpm) return false;
  cur.n += 1;
  return true;
}

export function gate(token: string, origin?: string) {
  if (!tokenOk(token)) return "Yetkisiz. API anahtarı veya ekip kodu gerekli.";
  if (!originOk(origin)) return "Bu kaynak izinli değil.";
  if (!rateOk(token)) return "İstek limiti aşıldı. Bir dakika bekleyin.";
  return null;
}

export function newApiKey() {
  return stableLiveKey();
}

export function currentSecretHint() {
  return staffSecret().length >= 4;
}
