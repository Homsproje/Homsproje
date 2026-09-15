import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { TECHNIQUES } from "@/lib/prompts";

export const Route = createFileRoute("/teknikler")({ component: TechniquesPage });

function TechniquesPage() {
  return (
    <AppShell footer>
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Plan → 3D</p>
        <h1 className="mt-2 max-w-[18ch] font-display text-4xl font-medium sm:text-5xl">
          Dönüşüm teknikleri.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Kat planını tek yöntemle değil, işin sorduğu dilde okuyun. Aynı çizimden maket, iç kare, kütle,
          kesit, pafta veya cephe — reklam için.
        </p>

        <ol className="mt-10 grid gap-3 lg:grid-cols-2">
          {TECHNIQUES.map((t) => (
            <li key={t.id} className="flex flex-col rounded-3xl bg-card p-6 shadow-[var(--shadow-border)]">
              <span className="text-kicker uppercase tracking-kicker text-subtle">{t.kicker}</span>
              <h2 className="mt-8 font-display text-3xl font-medium">{t.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{t.body}</p>
              <Button asChild className="mt-6 w-fit" variant="outline">
                <Link to="/studio">
                  Bu teknikle üret
                  <ArrowUpRight />
                </Link>
              </Button>
            </li>
          ))}
        </ol>
      </main>
    </AppShell>
  );
}
