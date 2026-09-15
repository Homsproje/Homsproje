import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { LISTINGS, REGIONS } from "@/lib/site";

export const Route = createFileRoute("/portfoy/$id")({ component: ListingPage });

function ListingPage() {
  const { id } = Route.useParams();
  const listing = LISTINGS.find((l) => l.id === id);

  if (!listing) {
    return (
      <Shell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Daire bulunamadı</h1>
          <Button asChild className="mt-6">
            <Link to="/portfoy">Portföye dön</Link>
          </Button>
        </main>
      </Shell>
    );
  }

  const region = REGIONS.find((r) => r.id === listing.region);

  return (
    <Shell>
      <main className="mx-auto grid max-w-[1280px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
        <figure className="overflow-hidden rounded-3xl shadow-[var(--shadow-border)]">
          <img src={listing.image} alt={listing.title} className="aspect-[4/3] w-full object-cover" />
        </figure>
        <div>
          <p className="text-kicker uppercase tracking-kicker text-muted-foreground">
            {region?.name} · {listing.status}
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium">{listing.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {listing.rooms} · {listing.area}
          </p>
          <p className="mt-5 text-pretty text-muted-foreground">{listing.body}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Bu plan tipi, beklenti ve bütçe uyumu görüldükten sonra yerinde incelenir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/iletisim" search={{ bolge: listing.region, daire: listing.id }}>
                Bu daire için yazın
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/portfoy">Portföy</Link>
            </Button>
          </div>
        </div>
      </main>
    </Shell>
  );
}
