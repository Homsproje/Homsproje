import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { LISTINGS, REGIONS, type RegionId } from "@/lib/site";

export const Route = createFileRoute("/portfoy")({ component: PortfolioPage });

function PortfolioPage() {
  const [region, setRegion] = useState<RegionId | "all">("all");
  const items = useMemo(
    () => (region === "all" ? LISTINGS : LISTINGS.filter((l) => l.region === region)),
    [region],
  );
  const current = REGIONS.find((r) => r.id === region);

  return (
    <Shell>
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Portföy</p>
        <h1 className="mt-2 max-w-[16ch] font-display text-4xl font-medium sm:text-5xl">Plan tipleri.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Bölgeye göre oda seçenekleri. Size uyan daire, beklenti ve bütçe okunduktan sonra netleşir.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRegion("all")}
            className={`h-10 rounded-full px-3 text-sm ${
              region === "all" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"
            }`}
          >
            Tümü
          </button>
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegion(r.id)}
              className={`h-10 rounded-full px-3 text-sm ${
                region === r.id ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
        {current && <p className="mt-3 text-sm text-muted-foreground">{current.rooms.join(" · ")}</p>}

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const loc = REGIONS.find((r) => r.id === p.region);
            return (
              <li key={p.id}>
                <Link
                  to="/portfoy/$id"
                  params={{ id: p.id }}
                  className="group block overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-border)]"
                >
                  <img src={p.image} alt={p.title} className="aspect-[16/11] w-full object-cover" />
                  <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-kicker uppercase tracking-kicker text-muted-foreground">
                        {loc?.name} · {p.rooms} · {p.area}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-0.5 size-4 text-subtle" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </Shell>
  );
}
