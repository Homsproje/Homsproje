export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. Single source of truth for
 * the split — gate audience, gate endpoints and connector-token semantics all
 * key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID");
}

/**
 * True when the process should behave as production (no PGLite fallback,
 * require DATABASE_URL, etc.).
 *
 * - NODE_ENV=production
 * - VERCEL=1 (Vercel production / preview deploys)
 * - HOMS_REQUIRE_DATABASE=true (explicit opt-in)
 */
export function isProductionRuntime(): boolean {
  if (env("HOMS_REQUIRE_DATABASE") === "true") return true;
  if (env("VERCEL") === "1") return true;
  if (process.env.NODE_ENV === "production") return true;
  return false;
}
