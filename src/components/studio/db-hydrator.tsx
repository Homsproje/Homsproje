import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { loadProjectsFromDb } from "@/lib/studio-sync";
import { useStudio } from "@/store/studio";

/**
 * When a Better Auth user is signed in, load their projects from Postgres
 * and replace the local Studio cache (source of truth = DB).
 */
export function StudioDbHydrator() {
  const { user, isPending } = useCurrentUser();
  const hydrateFromDb = useStudio((s) => s.hydrateFromDb);
  const dbHydrated = useStudio((s) => s.dbHydrated);
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user?.id) return;
    if (ranFor.current === user.id && dbHydrated) return;
    ranFor.current = user.id;

    void loadProjectsFromDb().then((res) => {
      if (res.ok) hydrateFromDb(res.projects);
    });
  }, [user?.id, isPending, hydrateFromDb, dbHydrated]);

  return null;
}
