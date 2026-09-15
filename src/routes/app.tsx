import { createFileRoute } from "@tanstack/react-router";
import { AppFrame } from "@/components/layout/app-frame";
import { Workspace } from "@/components/studio/workspace";

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    const id = typeof search.id === "string" ? search.id : undefined;
    return id ? { id } : {};
  },
  component: AppPage,
});

function AppPage() {
  const { id } = Route.useSearch();
  return (
    <AppFrame>
      <Workspace chatIdFromUrl={id} />
    </AppFrame>
  );
}
