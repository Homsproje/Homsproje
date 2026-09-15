const KEY = "homs-staff-v3";
const PIN_KEY = "homs-pin";
const FAIL_KEY = "homs-staff-fail";
const SESSION_KEY = "homs-session-mode";
export const STAFF_CODE = "Homs3369063";

let memory = false;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("homs-staff"));
}

export function getStaffPin() {
  if (typeof window === "undefined") return STAFF_CODE;
  try {
    return window.localStorage.getItem(PIN_KEY) || STAFF_CODE;
  } catch {
    return STAFF_CODE;
  }
}

export function setStaffPin(next: string) {
  const n = next.replace(/\s+/g, "");
  if (n.length < 8) return false;
  window.localStorage.setItem(PIN_KEY, n);
  return true;
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

export function unlockStaff(code: string) {
  const wait = lockRemaining();
  if (wait > 0) return false;
  const n = code.replace(/\s+/g, "");
  if (n !== getStaffPin()) {
    const f = failState();
    const nFail = f.n + 1;
    const until = nFail >= 5 ? Date.now() + 15 * 60_000 : 0;
    try {
      window.localStorage.setItem(FAIL_KEY, JSON.stringify({ n: nFail, until }));
    } catch {
      /* ignore */
    }
    return false;
  }
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
  return true;
}

export function lockStaff() {
  memory = false;
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
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
