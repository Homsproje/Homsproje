import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { REGIONS, SITE, STEPS } from "@/lib/site";

export const Route = createFileRoute("/hakkimizda")({ component: AboutPage });

function AboutPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Hakkımızda</p>
            <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">{SITE.name}</h1>
            <p className="mt-3 font-display text-xl text-muted-foreground">{SITE.tagline}</p>
            <p className="mt-5 text-pretty text-muted-foreground">
              {SITE.city}’de müteahhitlerin ortak satış noktasıyız. Farklı projelerin daireleri tek portföyde
              toplanır; işimiz daire ezberi yapmak değil, beklentiyi doğru okumaktır.
            </p>
            <p className="mt-4 text-pretty text-muted-foreground">
              Çalışma düzenimiz kısa: kişinin nasıl yaşamak istediği, bölge tercihi ve bütçesi analiz edilir.
              Bu çerçeveye uyan projeler sunulur. Fiyat–performans birlikte değerlendirilir; beğenilen daire
              yerinde incelenir. Uyuyorsa süreç tamamlanır.
            </p>
            <p className="mt-4 text-pretty text-muted-foreground">
              Bölgeler: {REGIONS.map((r) => r.name).join(", ")}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/iletisim">İletişim</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/bolgeler">Bölgeler</Link>
              </Button>
            </div>
          </div>
          <figure className="overflow-hidden rounded-3xl shadow-[var(--shadow-border)]">
            <img src="/samples/office.jpg" alt="Homs Proje" className="h-full w-full object-cover" />
          </figure>
        </div>

        <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-border)]">
              <p className="text-kicker uppercase tracking-kicker text-subtle">{s.n}</p>
              <h2 className="mt-4 font-display text-2xl font-medium">{s.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </main>
    </Shell>
  );
}
