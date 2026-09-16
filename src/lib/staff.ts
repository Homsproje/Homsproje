const KEY = "homs-staff-v4";
const FAIL_KEY = "homs-staff-fail";
const SESSION_KEY = "homs-session-mode";

let memory = false;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("homs-staff"));
}

export function sessionMode(): "local" | "session" {
  try {
    return window.localStorage.getItem(SESSION_KEY) === "session" ? "session" : "local";
  } catch {
    return "local";
  }
}

export function setSessionMode(mode: "local" | "session") {
  window.localStorage.setItem(SESSION_KEY, mode);
}

function failState() {
  try {
    const raw = window.localStorage.getItem(FAIL_KEY);
    return raw ? (JSON.parse(raw) as { n: number; until: number }) : { n: 0, until: 0 };
  } catch {
    return { n: 0, until: 0 };
  }
}

export function lockRemaining() {
  const left = failState().until - Date.now();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

export function isStaffSession() {
  if (memory) return true;
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(KEY) === "1") return true;
    if (sessionMode() === "local" && window.localStorage.getItem(KEY) === "1") return true;
    return false;
  } catch {
    return memory;
  }
}

function markUnlocked() {
  memory = true;
  try {
    window.localStorage.removeItem(FAIL_KEY);
    window.sessionStorage.setItem(KEY, "1");
    if (sessionMode() === "local") window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  emit();
}

function markFail() {
  const f = failState();
  const nFail = f.n + 1;
  const until = nFail >= 5 ? Date.now() + 15 * 60_000 : 0;
  try {
    window.localStorage.setItem(FAIL_KEY, JSON.stringify({ n: nFail, until }));
  } catch {
    /* ignore */
  }
}

export async function unlockStaff(code: string) {
  const wait = lockRemaining();
  if (wait > 0) return false;
  const { unlockStaffRemote } = await import("@/lib/staff-auth");
  const res = await unlockStaffRemote({ data: { code } });
  if (!res.ok) {
    markFail();
    return false;
  }
  markUnlocked();
  return true;
}

export async function hydrateStaffSession() {
  const { staffRemoteOk } = await import("@/lib/staff-auth");
  const res = await staffRemoteOk();
  if (res.ok) markUnlocked();
  else lockStaff();
  return res.ok;
}

export function lockStaff() {
  memory = false;
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  void import("@/lib/staff-auth").then((m) => m.lockStaffRemote()).catch(() => {});
  emit();
}

export function subscribeStaff(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("homs-staff", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("homs-staff", cb);
    window.removeEventListener("storage", cb);
  };
}
