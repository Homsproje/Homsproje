import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { LISTINGS, REGIONS, SITE, STEPS } from "@/lib/site";

export const Route = createFileRoute("/site")({ component: HomePage });

function HomePage() {
  return (
    <Shell>
      <main>
        <section>
          <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-12 lg:py-14">
            <div>
              <p className="mb-4 text-kicker uppercase tracking-kicker text-muted-foreground">
                {SITE.city} · Ortak satış ofisi
              </p>
              <h1 className="max-w-[14ch] font-display text-display font-medium tracking-[-0.04em] text-foreground">
                {SITE.tagline}
              </h1>
              <p className="mt-5 max-w-md text-pretty text-base text-muted-foreground sm:text-lg">
                Müteahhit portföyünü tek noktada toplarız. Beklentiniz ve bütçeniz okunur; beş bölgedeki
                uygun projeler sunulur. Fiyat–performans netleşince beğendiğiniz daire yerinde görülür.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/iletisim">
                    Talep bırak
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/portfoy">Portföy</Link>
                </Button>
              </div>
            </div>
            <figure className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-border)]">
              <img src="/samples/office.jpg" alt="Homs Proje satış ofisi" className="aspect-[16/10] w-full object-cover sm:aspect-[16/11]" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-foreground/55 to-transparent px-5 py-4 text-background">
                <span className="text-sm">Ortak satış ofisi</span>
                <span className="text-kicker uppercase tracking-kicker">{SITE.domain}</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
            <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Bölgeler</p>
            <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">Çalıştığımız hat.</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {REGIONS.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/bolgeler"
                    hash={r.id}
                    className="group block overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-border)]"
                  >
                    <img src={r.image} alt={r.name} className="aspect-[4/3] w-full object-cover" />
                    <div className="px-4 py-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.rooms.join(" · ")}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
            <div>
              <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Yöntem</p>
              <h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">Analiz, sunum, yerinde inceleme.</h2>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Listeden değil, beklenti ve bütçeden başlarız. Uyan daireler yan yana konur; karar yerinde netleşir.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link to="/hakkimizda">Homs Proje hakkında</Link>
              </Button>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-3xl bg-border shadow-[var(--shadow-border)] sm:grid-cols-2">
              {STEPS.map((s) => (
                <li key={s.n} className="bg-card p-6">
                  <p className="text-kicker uppercase tracking-kicker text-subtle">{s.n}</p>
                  <h3 className="mt-6 font-display text-2xl font-medium">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Seçilmiş daireler</p>
                <h2 className="mt-1 font-display text-3xl font-medium sm:text-4xl">Portföyden.</h2>
              </div>
              <Button asChild variant="ghost">
                <Link to="/portfoy">
                  Tümü
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LISTINGS.filter((p) => ["besiktas-1plus0", "etiler-2plus1", "gokturk-4plus1"].includes(p.id)).map(
                (p) => (
                  <li key={p.id}>
                    <Link
                      to="/portfoy/$id"
                      params={{ id: p.id }}
                      className="group block overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-border)]"
                    >
                      <img
                        src={p.image}
                        alt={p.title}
                        className="aspect-[16/11] w-full object-cover transition-transform duration-[var(--motion-slow)] group-hover:scale-[1.02]"
                      />
                      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium">{p.title}</p>
                          <p className="text-kicker uppercase tracking-kicker text-muted-foreground">
                            {p.rooms} · {p.area}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 size-4 text-subtle" />
                      </div>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>
      </main>
    </Shell>
  );
}
