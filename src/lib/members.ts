/**
 * LEGACY client-side membership store — NOT used as auth source in Stage-2+.
 *
 * Production authentication:
 *   - Better Auth email/password (`src/lib/auth`)
 *   - Memberships table (`memberships` / `src/lib/membership.server.ts`)
 *   - Staff gate (`HOMS_STAFF_CODE`)
 *
 * This file remains only for any residual local demos. Do not store new
 * production passwords here. Plaintext passwords must never be the source of truth.
 */

export type Plan = {
  id: string;
  name: string;
  price: number;
  days: number;
  terms: string;
};

export type Member = {
  email: string;
  name: string;
  /** @deprecated Plaintext — never rely on this in production. */
  pass: string;
  plan: string;
  until: number;
};

const PLANS_KEY = "homs-plans-v1";
const USERS_KEY = "homs-users-v1";
const SESSION_KEY = "homs-member-session";

export const DEFAULT_PLANS: Plan[] = [
  { id: "trial", name: "3 gün ücretsiz", price: 0, days: 3, terms: "Kart gerekmez. Süre bitince üyelik gerekir." },
  { id: "aylik", name: "Aylık", price: 1490, days: 30, terms: "İptal her an. Dönem sonuna kadar erişim." },
  { id: "yillik", name: "Yıllık", price: 12900, days: 365, terms: "Yıllık peşin. 2 ay hediye hesabı." },
];

export function loadPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? (JSON.parse(raw) as Plan[]) : DEFAULT_PLANS;
  } catch {
    return DEFAULT_PLANS;
  }
}

export function savePlans(plans: Plan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function loadUsers(): Member[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") as Member[];
  } catch {
    return [];
  }
}

function saveUsers(users: Member[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function currentMember(): Member | null {
  try {
    const email = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    const u = loadUsers().find((x) => x.email === email);
    if (!u || u.until < Date.now()) return null;
    return u;
  } catch {
    return null;
  }
}

export function isMemberOk() {
  return Boolean(currentMember());
}

export function loginMember(email: string, pass: string) {
  const u = loadUsers().find((x) => x.email === email.trim().toLowerCase() && x.pass === pass);
  if (!u) return { ok: false as const, error: "E-posta veya şifre." };
  if (u.until < Date.now()) return { ok: false as const, error: "Süre doldu." };
  sessionStorage.setItem(SESSION_KEY, u.email);
  localStorage.setItem(SESSION_KEY, u.email);
  return { ok: true as const };
}

export function signupMember(name: string, email: string, pass: string, planId: string) {
  const plans = loadPlans();
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const e = email.trim().toLowerCase();
  if (!e || !pass || pass.length < 6) return { ok: false as const, error: "E-posta ve en az 6 karakter şifre." };
  const users = loadUsers().filter((x) => x.email !== e);
  const until = Date.now() + plan.days * 86400000;
  const next: Member = { email: e, name: name.trim() || e, pass, plan: plan.id, until };
  users.push(next);
  saveUsers(users);
  sessionStorage.setItem(SESSION_KEY, e);
  localStorage.setItem(SESSION_KEY, e);
  return { ok: true as const };
}

export function logoutMember() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function setUserUntil(email: string, until: number) {
  saveUsers(loadUsers().map((u) => (u.email === email ? { ...u, until } : u)));
}
