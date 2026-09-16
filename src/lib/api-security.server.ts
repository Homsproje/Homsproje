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
const hits = new Map<string, { n: number; t: number }>();

export const hash = hashValue;

export function load(): SecFile {
  try {
    if (!existsSync(FILE)) {
      return { keyHashes: [], origins: ["https://homsproje.com", "https://www.homsproje.com"], rpm: 30 };
    }
    return JSON.parse(readFileSync(FILE, "utf8")) as SecFile;
  } catch {
    return { keyHashes: [], origins: ["https://homsproje.com"], rpm: 30 };
  }
}

export function save(data: SecFile) {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {
    /* serverless fs may be read-only */
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
