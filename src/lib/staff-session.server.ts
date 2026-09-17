import { createHmac } from "node:crypto";
import { staffSecret } from "@/lib/staff-secret.server";

export const STAFF_COOKIE = "homs_staff";
const MAX_AGE = 60 * 60 * 24 * 14;

function sign(payload: string) {
  return createHmac("sha256", staffSecret()).update(payload).digest("hex");
}

export function makeStaffToken() {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `ok.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function tokenValid(token?: string | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ok, expRaw, sig] = parts;
  if (ok !== "ok") return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const payload = `${ok}.${expRaw}`;
  return sign(payload) === sig;
}

export async function readStaffCookie() {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie(STAFF_COOKIE) ?? "";
  } catch {
    return "";
  }
}

export async function writeStaffCookie(value: string, maxAge = MAX_AGE) {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(STAFF_COOKIE, value, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge,
  });
}

export async function staffCookieOk() {
  return tokenValid(await readStaffCookie());
}

/** Server-side staff session check used by AI entitlement gates. */
export async function isStaffSessionServer() {
  return staffCookieOk();
}
