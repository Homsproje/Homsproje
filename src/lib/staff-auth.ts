import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const unlockStaffRemote = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string().min(4).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { pinMatches } = await import("@/lib/staff-secret.server");
    const sess = await import("@/lib/staff-session.server");
    if (!pinMatches(data.code)) return { ok: false as const, error: "Kod eşleşmedi." };
    await sess.writeStaffCookie(sess.makeStaffToken());
    return { ok: true as const };
  });

export const lockStaffRemote = createServerFn({ method: "POST" }).handler(async () => {
  const sess = await import("@/lib/staff-session.server");
  await sess.writeStaffCookie("", 0);
  return { ok: true as const };
});

export const staffRemoteOk = createServerFn({ method: "GET" }).handler(async () => {
  const sess = await import("@/lib/staff-session.server");
  return { ok: await sess.staffCookieOk() };
});
