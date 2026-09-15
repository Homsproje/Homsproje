import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { STAFF_CODE } from "@/lib/staff";

export type SecFile = {
  keyHashes: string[];
  origins: string[];
  rpm: number;
  pinHash?: string;
};

const FILE = join(process.cwd(), "data", "homs-security.json");
const hits = new Map<string, { n: number; t: number }>();

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

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
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function staffOk(pin: string) {
  const n = pin.replace(/\s+/g, "");
  if (n === STAFF_CODE) return true;
  const s = load();
  if (s.pinHash && s.pinHash === hash(n)) return true;
  return s.keyHashes.includes(hash(n));
}

export function tokenOk(token: string) {
  const t = token.replace(/\s+/g, "");
  if (t === STAFF_CODE) return true;
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
  return `homs_live_${randomBytes(18).toString("hex")}`;
}
