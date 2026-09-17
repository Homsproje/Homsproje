import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { loadProjectsFromDb } from "@/lib/studio-sync";
import { useStudio } from "@/store/studio";

/**
 * When a Better Auth user is signed in:
 * 1) Load project list from DB (metadata).
 * 2) If the current route/selection references a project id, deep-load assets+turns.
 */
export function StudioDbHydrator() {
  const { user, isPending } = useCurrentUser();
  const hydrateFromDb = useStudio((s) => s.hydrateFromDb);
  const dbHydrated = useStudio((s) => s.dbHydrated);
  const ensureProjectDeepLoaded = useStudio((s) => s.ensureProjectDeepLoaded);
  const ranFor = useRef<string | null>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (isPending) return;
    if (!user?.id) return;
    if (ranFor.current === user.id && dbHydrated) return;
    ranFor.current = user.id;

    void loadProjectsFromDb().then((res) => {
      if (res.ok) hydrateFromDb(res.projects);
    });
  }, [user?.id, isPending, hydrateFromDb, dbHydrated]);

  // Deep-load when path contains a project id segment (best-effort).
  useEffect(() => {
    if (!user?.id || !dbHydrated) return;
    // Match /app/studio/<id> or ?project=<id> style paths without hardcoding all routes.
    const m = pathname.match(/\/(?:studio|project|p)\/([a-zA-Z0-9_-]{4,})/);
    const fromQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("project")
        : null;
    const projectId = m?.[1] || fromQuery;
    if (projectId && !projectId.startsWith("demo-")) {
      void ensureProjectDeepLoaded(projectId);
    }
  }, [pathname, user?.id, dbHydrated, ensureProjectDeepLoaded]);

  return null;
}
