/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Stage-2: enabled. Forms use `authClient.signUp.email` / `authClient.signIn.email`
 * from `@/lib/auth/client`. Passwords are hashed by Better Auth (never plaintext).
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;
