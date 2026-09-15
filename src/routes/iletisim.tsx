import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadForm, type FormConfig } from "@/lib/form-store";
import { SITE, type RegionId } from "@/lib/site";

export const Route = createFileRoute("/iletisim")({
  validateSearch: (search: Record<string, unknown>): { bolge?: RegionId; daire?: string } => {
    const bolge = typeof search.bolge === "string" ? (search.bolge as RegionId) : undefined;
    const daire = typeof search.daire === "string" ? search.daire : undefined;
    return { ...(bolge ? { bolge } : {}), ...(daire ? { daire } : {}) };
  },
  component: ContactPage,
});

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function ContactPage() {
  const { bolge, daire } = Route.useSearch();
  const [cfg, setCfg] = useState<FormConfig | null>(null);
  const [sent, setSent] = useState(false);
  const [regions, setRegions] = useState<string[]>(bolge ? [bolge] : []);
  const [rooms, setRooms] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [extra, setExtra] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const f = loadForm();
    setCfg(f);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cfg) return;
    const data = new FormData(e.currentTarget);
    const lead = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      regions,
      rooms,
      budgets,
      purposes,
      extra,
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
    toast("Talebiniz alındı.");
    const wa = cfg.whatsapp.replace(/\D/g, "");
    if (wa) {
      const body = [
        `Homs Proje talep`,
        `Ad: ${lead.name}`,
        `Tel: ${lead.phone}`,
        lead.email ? `E-posta: ${lead.email}` : "",
        regions.length ? `Bölge: ${regions.join(", ")}` : "",
        rooms.length ? `Plan: ${rooms.join(", ")}` : "",
        budgets.length ? `Bütçe: ${budgets.join(", ")}` : "",
        purposes.length ? `Amaç: ${purposes.join(", ")}` : "",
        lead.message,
      ]
        .filter(Boolean)
        .join("\n");
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(body)}`, "_blank");
    }
    e.currentTarget.reset();
  }

  if (!cfg) return null;

  return (
    <Shell>
      <main className="mx-auto grid max-w-[1280px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <div>
          <p className="text-kicker uppercase tracking-kicker text-muted-foreground">İletişim</p>
          <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">Beklentinizi yazın.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Birden fazla bölge ve plan seçebilirsiniz. Size uyan projeleri hazırlar, fiyat–performans üzerinden
            değerlendiririz. Beğenilen daire yerinde incelenir.
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
          </dl>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 rounded-3xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
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

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Bölgeler — birden fazla</legend>
            <div className="flex flex-wrap gap-1.5">
              {cfg.regions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegions((c) => toggle(c, r.id))}
                  className={`h-9 rounded-full px-3 text-sm ${regions.includes(r.id) ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Plan tipi — birden fazla</legend>
            <div className="flex flex-wrap gap-1.5">
              {cfg.rooms.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRooms((c) => toggle(c, r))}
                  className={`h-9 rounded-full px-3 text-sm ${rooms.includes(r) ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Bütçe aralığı</legend>
            <div className="flex flex-wrap gap-1.5">
              {cfg.budgets.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBudgets((c) => toggle(c, r))}
                  className={`h-9 rounded-full px-3 text-sm ${budgets.includes(r) ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Daire alım amacı</legend>
            <div className="flex flex-wrap gap-1.5">
              {cfg.purposes.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPurposes((c) => toggle(c, r))}
                  className={`h-9 rounded-full px-3 text-sm ${purposes.includes(r) ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </fieldset>

          {cfg.extra.map((q) => (
            <fieldset key={q.id}>
              <legend className="mb-2 text-sm font-medium">{q.label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setExtra((c) => ({ ...c, [q.id]: toggle(c[q.id] ?? [], o) }))
                    }
                    className={`h-9 rounded-full px-3 text-sm ${(extra[q.id] ?? []).includes(o) ? "bg-foreground text-background" : "bg-muted"}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="space-y-2">
            <Label htmlFor="message">Nasıl yaşamak istiyorsunuz?</Label>
            <Textarea id="message" name="message" placeholder="Aile, sessizlik, merkeze yakınlık…" />
          </div>
          <Button type="submit" className="w-full" size="lg">
            {sent ? "Gönderildi — yenisi" : cfg.whatsapp ? "WhatsApp ile gönder" : "Talep bırak"}
          </Button>
        </form>
      </main>
    </Shell>
  );
}
