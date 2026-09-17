import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { loadProjectsFromDb } from "@/lib/studio-sync";
import { useStudio } from "@/store/studio";

/**
 * When a Better Auth user is signed in:
 * 1) Load project list from DB (metadata).
 * 2) Deep-load assets + turns for projects (ownership enforced server-side).
 * 3) Prefer deep-loading the project referenced by the current route/query first.
 */
export function StudioDbHydrator() {
  const { user, isPending } = useCurrentUser();
  const hydrateFromDb = useStudio((s) => s.hydrateFromDb);
  const dbHydrated = useStudio((s) => s.dbHydrated);
  const ensureProjectDeepLoaded = useStudio((s) => s.ensureProjectDeepLoaded);
  const projects = useStudio((s) => s.projects);
  const ranFor = useRef<string | null>(null);
  const deepRanFor = useRef<string | null>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    if (isPending) return;
    if (!user?.id) return;
    if (ranFor.current === user.id && dbHydrated) return;
    ranFor.current = user.id;

    void loadProjectsFromDb().then((res) => {
      if (res.ok) hydrateFromDb(res.projects);
    });
  }, [user?.id, isPending, hydrateFromDb, dbHydrated]);

  // After list hydrate: deep-load route project first, then remaining non-demo projects.
  useEffect(() => {
    if (!user?.id || !dbHydrated) return;
    if (deepRanFor.current === user.id) return;
    deepRanFor.current = user.id;

    const fromPath = pathname.match(/\/(?:studio|project|p)\/([a-zA-Z0-9_-]{4,})/)?.[1];
    const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
    const fromQuery = params.get("id") || params.get("project");
    const preferred = fromPath || fromQuery;

    const ids = projects
      .map((p) => p.id)
      .filter((id) => !id.startsWith("demo-"));

    const ordered = preferred && ids.includes(preferred)
      ? [preferred, ...ids.filter((id) => id !== preferred)]
      : ids;

    // Sequential deep-load to avoid thundering herd.
    void (async () => {
      for (const id of ordered.slice(0, 20)) {
        await ensureProjectDeepLoaded(id);
      }
    })();
  }, [user?.id, dbHydrated, projects, pathname, searchStr, ensureProjectDeepLoaded]);

  return null;
}
