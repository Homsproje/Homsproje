import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { SERVICES, SITE, STEPS } from "@/lib/site";

export const Route = createFileRoute("/hizmetler")({ component: ServicesPage });

function ServicesPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-kicker uppercase tracking-kicker text-muted-foreground">{SITE.name}</p>
        <h1 className="mt-2 max-w-[18ch] font-display text-4xl font-medium sm:text-5xl">
          Beklentiye uygun proje.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Daire arayanla müteahhit portföyünü aynı dilde buluştururuz. Analiz, eşleştirme, fiyat–performans
          ve yerinde inceleme — dört adım, tek amaç: doğru daire.
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <li key={s.kicker} className="flex flex-col rounded-3xl bg-card p-6 shadow-[var(--shadow-border)]">
              <span className="text-kicker uppercase tracking-kicker text-subtle">{s.kicker}</span>
              <h2 className="mt-8 font-display text-3xl font-medium">{s.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ul>

        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-border)]">
              <p className="text-kicker uppercase tracking-kicker text-subtle">{s.n}</p>
              <h3 className="mt-4 font-display text-xl font-medium">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>

        <Button asChild className="mt-10">
          <Link to="/iletisim">Talep bırak</Link>
        </Button>
      </main>
    </Shell>
  );
}
