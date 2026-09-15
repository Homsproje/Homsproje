import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({ component: Gate });

function Gate() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-5 pb-10 pt-24">
      <img src="/brand/logo-stacked.png" alt={SITE.name} className="brand-logo mx-auto h-24 w-auto object-contain" />
      <p className="mt-3 text-center text-kicker uppercase tracking-kicker text-muted-foreground">İki ayrı adres</p>
      <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/site"
          className="rounded-3xl bg-card px-5 py-6 text-center shadow-[var(--shadow-border)]"
        >
          <span className="block font-display text-2xl font-medium">Site</span>
          <span className="mt-1 block text-sm text-muted-foreground">homsproje.com tanıtım</span>
        </Link>
        <Link
          to="/app"
          className="rounded-3xl bg-foreground px-5 py-6 text-center text-background"
        >
          <span className="block font-display text-2xl font-medium">App</span>
          <span className="mt-1 block text-sm opacity-80">Ekip stüdyosu — kod ile</span>
        </Link>
      </div>
    </main>
  );
}
