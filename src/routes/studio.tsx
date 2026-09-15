import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/studio")({
  beforeLoad: ({ search }) => {
    const id = typeof (search as { id?: string }).id === "string" ? (search as { id: string }).id : undefined;
    throw redirect({ to: "/app", search: id ? { id } : {} });
  },
  component: () => null,
});
