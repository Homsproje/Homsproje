import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ALL_ROOMS, REGIONS, ROOM_OPTIONS, SITE, type RegionId } from "@/lib/site";

export const Route = createFileRoute("/iletisim")({
  validateSearch: (search: Record<string, unknown>): { bolge?: RegionId; daire?: string } => {
    const bolge = REGIONS.some((r) => r.id === search.bolge) ? (search.bolge as RegionId) : undefined;
    const daire = typeof search.daire === "string" ? search.daire : undefined;
    return { ...(bolge ? { bolge } : {}), ...(daire ? { daire } : {}) };
  },
  component: ContactPage,
});

function ContactPage() {
  const { bolge, daire } = Route.useSearch();
  const [sent, setSent] = useState(false);
  const [region, setRegion] = useState<string>(bolge ?? "");
  const rooms = useMemo(
    () => (region && region in ROOM_OPTIONS ? ROOM_OPTIONS[region as RegionId] : ALL_ROOMS),
    [region],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const lead = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      region: String(data.get("region") ?? ""),
      rooms: String(data.get("rooms") ?? ""),
      listing: daire ?? "",
      message: String(data.get("message") ?? "").trim(),
      at: new Date().toISOString(),
    };
    if (!lead.name || !lead.phone) {
      toast.error("Ad ve telefon gerekli.");
      return;
    }
    const prev = JSON.parse(localStorage.getItem("homs-leads") || "[]") as unknown[];
    localStorage.setItem("homs-leads", JSON.stringify([lead, ...prev].slice(0, 80)));
    setSent(true);
    toast("Talebiniz alındı. En kısa sürede dönüş yapacağız.");
    e.currentTarget.reset();
  }

  return (
    <Shell>
      <main className="mx-auto grid max-w-[1280px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <div>
          <p className="text-kicker uppercase tracking-kicker text-muted-foreground">İletişim</p>
          <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">Beklentinizi yazın.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Bölge, plan tipi ve nasıl yaşamak istediğinizi iletin. Size uyan projeleri hazırlar,
            fiyat–performans üzerinden değerlendiririz. Beğenilen daire yerinde incelenir.
          </p>
          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="text-kicker uppercase tracking-kicker text-muted-foreground">E-posta</dt>
              <dd className="mt-1">
                <a href={`mailto:${SITE.email}`} className="text-foreground">
                  {SITE.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-kicker uppercase tracking-kicker text-muted-foreground">Yer</dt>
              <dd className="mt-1">{SITE.city}</dd>
            </div>
            <div>
              <dt className="text-kicker uppercase tracking-kicker text-muted-foreground">Hat</dt>
              <dd className="mt-1">{REGIONS.map((r) => r.name).join(" · ")}</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Ad</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" autoComplete="email" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="region">Bölge</Label>
              <select
                id="region"
                name="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="flex h-11 w-full rounded-lg bg-card px-3 text-sm shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Fark etmez</option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rooms">Plan tipi</Label>
              <select
                id="rooms"
                name="rooms"
                className="flex h-11 w-full rounded-lg bg-card px-3 text-sm shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue=""
              >
                <option value="">Fark etmez</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Nasıl yaşamak istiyorsunuz?</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Aile, yatırım, sessizlik, merkeze yakınlık, bütçe aralığı…"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            {sent ? "Gönderildi — yenisi" : "Talep bırak"}
          </Button>
        </form>
      </main>
    </Shell>
  );
}
