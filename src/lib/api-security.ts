import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getApiSecurity = createServerFn({ method: "GET" }).handler(async () => {
  const { load } = await import("@/lib/api-security.server");
  const s = load();
  return { ok: true as const, origins: s.origins, rpm: s.rpm, keys: s.keyHashes.length };
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
    const sec = await import("@/lib/api-security.server");
    if (!sec.staffOk(data.pin)) return { ok: false as const, error: "Yetkisiz." };
    const s = sec.load();
    const extra = data.origins.map((o) => o.trim()).filter(Boolean);
    s.origins = Array.from(new Set([...extra, "https://homsproje.com", "https://www.homsproje.com"]));
    s.rpm = data.rpm;
    sec.save(s);
    return { ok: true as const, origins: s.origins, rpm: s.rpm };
  });

export const updateStaffPin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ pin: z.string().min(4), next: z.string().min(8).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sec = await import("@/lib/api-security.server");
    if (!sec.staffOk(data.pin)) return { ok: false as const, error: "Yetkisiz." };
    const s = sec.load();
    s.pinHash = sec.hash(data.next.replace(/\s+/g, ""));
    sec.save(s);
    return { ok: true as const };
  });

export const rotateApiKey = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string().min(4) }).parse(input))
  .handler(async ({ data }) => {
    const sec = await import("@/lib/api-security.server");
    if (!sec.staffOk(data.pin)) return { ok: false as const, error: "Yetkisiz." };
    const key = sec.newApiKey();
    const s = sec.load();
    s.keyHashes = [sec.hash(key)];
    sec.save(s);
    return { ok: true as const, key };
  });
