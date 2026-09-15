import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STAFF_CODE } from "@/lib/staff";

type SecFile = {
  keyHashes: string[];
  origins: string[];
  rpm: number;
  pinHash?: string;
};

const FILE = join(process.cwd(), "data", "homs-security.json");
const hits = new Map<string, { n: number; t: number }>();

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function load(): SecFile {
  try {
    if (!existsSync(FILE)) {
      return { keyHashes: [], origins: ["https://homsproje.com", "https://www.homsproje.com"], rpm: 30 };
    }
    return JSON.parse(readFileSync(FILE, "utf8")) as SecFile;
  } catch {
    return { keyHashes: [], origins: ["https://homsproje.com"], rpm: 30 };
  }
}

function save(data: SecFile) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function staffOk(pin: string) {
  const n = pin.replace(/\s+/g, "");
  if (n === STAFF_CODE) return true;
  const s = load();
  if (s.pinHash && s.pinHash === hash(n)) return true;
  return s.keyHashes.includes(hash(n));
}

export function tokenOk(token: string) {
  const t = token.replace(/\s+/g, "");
  if (t === STAFF_CODE) return true;
  const h = hash(t);
  return load().keyHashes.includes(h);
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

export const getApiSecurity = createServerFn({ method: "GET" }).handler(async () => {
  const s = load();
  return {
    ok: true as const,
    origins: s.origins,
    rpm: s.rpm,
    keys: s.keyHashes.length,
  };
});

export const saveApiSecurity = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        pin: z.string().min(4),
        origins: z.array(z.string()).max(12),
        rpm: z.number().min(5).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!staffOk(data.pin)) return { ok: false as const, error: "Yetkisiz." };
    const s = load();
    const extra = data.origins.map((o) => o.trim()).filter(Boolean);
    s.origins = Array.from(new Set([...extra, "https://homsproje.com", "https://www.homsproje.com"]));
    s.rpm = data.rpm;
    save(s);
    return { ok: true as const, origins: s.origins, rpm: s.rpm };
  });

export const updateStaffPin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ pin: z.string().min(4), next: z.string().min(8).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!staffOk(data.pin)) return { ok: false as const, error: "Yetkisiz." };
    const s = load();
    s.pinHash = hash(data.next.replace(/\s+/g, ""));
    save(s);
    return { ok: true as const };
  });

export const rotateApiKey = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string().min(4) }).parse(input))
  .handler(async ({ data }) => {
    if (!staffOk(data.pin)) return { ok: false as const, error: "Yetkisiz." };
    const key = `homs_live_${randomBytes(18).toString("hex")}`;
    const s = load();
    s.keyHashes = [hash(key)];
    save(s);
    return { ok: true as const, key };
  });
