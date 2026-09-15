import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/site";

export const Route = createFileRoute("/bolgeler")({ component: RegionsPage });

function RegionsPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Bölgeler</p>
        <h1 className="mt-2 max-w-[16ch] font-display text-4xl font-medium sm:text-5xl">
          Beşiktaş’tan Kemerburgaz’a.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Portföy bu hatta. Her bölgede plan tipleri nettir; size uyan daire beklenti ve bütçe okunduktan sonra seçilir.
        </p>

        <ul className="mt-10 space-y-10">
          {REGIONS.map((r) => (
              <li id={r.id} key={r.id} className="grid scroll-mt-24 gap-6 lg:grid-cols-2 lg:items-center">
                <figure className="overflow-hidden rounded-3xl shadow-[var(--shadow-border)]">
                  <img src={r.image} alt={r.name} className="aspect-[16/10] w-full object-cover" />
                </figure>
                <div>
                  <span className="text-kicker uppercase tracking-kicker text-subtle">{r.kicker}</span>
                  <h2 className="mt-2 font-display text-3xl font-medium">{r.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{r.line}</p>
                  <p className="mt-3 text-muted-foreground">{r.body}</p>
                  <p className="mt-3 text-sm">Plan tipleri: {r.rooms.join(" · ")}</p>
                  <Button asChild className="mt-6" variant="outline">
                    <Link to="/iletisim" search={{ bolge: r.id }}>
                      Bu bölge için yazın
                    </Link>
                  </Button>
                </div>
              </li>
          ))}
        </ul>
      </main>
    </Shell>
  );
}
