import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrowserChrome } from "@/components/layout/chrome";
import { StaffGate } from "@/components/layout/staff-gate";
import { Button } from "@/components/ui/button";
import { DEFAULT_FORM, loadForm, saveForm, type FormConfig } from "@/lib/form-store";
import { DEFAULT_PINS, loadPins, savePins, type MapPin } from "@/lib/map-store";
import { loadProjects, saveProjects, type SiteProject } from "@/lib/site-projects";
import { REGIONS, type RegionId } from "@/lib/site";
import { fileToDataUrl, uid } from "@/lib/utils";
import { useVisualViewport } from "@/lib/use-visual-viewport";

export const Route = createFileRoute("/site-yonetim")({ component: Page });

function Page() {
  const box = useVisualViewport();
  return (
    <StaffGate>
      <div
        className="flex w-full flex-col overflow-hidden bg-background"
        style={{ position: "fixed", left: 0, right: 0, top: box.top, height: box.height }}
      >
        <BrowserChrome />
        <Inner />
      </div>
    </StaffGate>
  );
}

function Inner() {
  const [form, setForm] = useState<FormConfig>(DEFAULT_FORM);
  const [pins, setPins] = useState<MapPin[]>(DEFAULT_PINS);
  const [newQ, setNewQ] = useState("");
  const [newOpts, setNewOpts] = useState("Evet, Hayır");
  const [projects, setProjects] = useState<SiteProject[]>([]);
  const [pname, setPname] = useState("");
  const [pregion, setPregion] = useState<RegionId>("besiktas");

  useEffect(() => {
    setForm(loadForm());
    setPins(loadPins());
    setProjects(loadProjects());
  }, []);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
      <Link to="/site" className="text-sm text-muted-foreground">
        ← Site
      </Link>
      <h1 className="font-display text-3xl font-medium">Site ayarları</h1>
      <p className="mt-1 text-sm text-muted-foreground">Talep formu, harita ve proje videoları. App’ten bağımsız.</p>

      <h2 className="mt-6 text-sm font-medium">Talep formu</h2>
      <label className="mt-3 block text-xs text-muted-foreground">WhatsApp</label>
      <input
        value={form.whatsapp}
        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
        placeholder="905xxxxxxxxx"
        className="mt-1 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
      />
      <label className="mt-3 block text-xs text-muted-foreground">Bütçeler (virgül)</label>
      <input
        value={form.budgets.join(", ")}
        onChange={(e) => setForm({ ...form, budgets: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        className="mt-1 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
      />
      <label className="mt-3 block text-xs text-muted-foreground">Plan tipleri (virgül)</label>
      <input
        value={form.rooms.join(", ")}
        onChange={(e) => setForm({ ...form, rooms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        className="mt-1 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
      />

      <h3 className="mt-4 text-sm font-medium">Soru ekle</h3>
      <input
        value={newQ}
        onChange={(e) => setNewQ(e.target.value)}
        placeholder="Soru"
        className="mt-1 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
      />
      <input
        value={newOpts}
        onChange={(e) => setNewOpts(e.target.value)}
        placeholder="Cevap seçenekleri, virgülle"
        className="mt-2 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
      />
      <Button
        size="sm"
        className="mt-2"
        variant="outline"
        onClick={() => {
          if (!newQ.trim()) return;
          const options = newOpts.split(",").map((s) => s.trim()).filter(Boolean);
          setForm({
            ...form,
            extra: [...form.extra, { id: `q-${Date.now()}`, label: newQ.trim(), options: options.length ? options : ["Evet", "Hayır"] }],
          });
          setNewQ("");
        }}
      >
        Soruyu ekle
      </Button>
      <ul className="mt-3 space-y-2">
        {form.extra.map((q) => (
          <li key={q.id} className="rounded-2xl bg-card px-3 py-2 text-sm shadow-[var(--shadow-border)]">
            <p className="font-medium">{q.label}</p>
            <input
              value={q.options.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  extra: form.extra.map((x) =>
                    x.id === q.id ? { ...x, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x,
                  ),
                })
              }
              className="mt-1 h-10 w-full rounded-full bg-muted px-3 text-base"
            />
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        className="mt-3"
        onClick={() => {
          saveForm(form);
          toast("Form kaydedildi");
        }}
      >
        Formu kaydet
      </Button>

      <h2 className="mt-8 text-sm font-medium">Harita pinleri</h2>
      <ul className="mt-2 space-y-2">
        {pins.map((p, i) => (
          <li key={p.id} className="rounded-2xl bg-card px-3 py-2 text-sm shadow-[var(--shadow-border)]">
            <p className="font-medium">{p.title}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                value={p.lat}
                onChange={(e) => setPins(pins.map((x, n) => (n === i ? { ...x, lat: Number(e.target.value) || x.lat } : x)))}
                className="h-10 rounded-full bg-muted px-3 text-base"
              />
              <input
                value={p.lng}
                onChange={(e) => setPins(pins.map((x, n) => (n === i ? { ...x, lng: Number(e.target.value) || x.lng } : x)))}
                className="h-10 rounded-full bg-muted px-3 text-base"
              />
            </div>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        className="mt-2"
        variant="outline"
        onClick={() => {
          savePins(pins);
          toast("Pinler kaydedildi");
        }}
      >
        Pinleri kaydet
      </Button>

      <h2 className="mt-8 text-sm font-medium">Bölge / proje videoları</h2>
      <div className="mt-2 flex gap-2">
        <select
          value={pregion}
          onChange={(e) => setPregion(e.target.value as RegionId)}
          className="h-11 rounded-full bg-card px-3 text-sm shadow-[var(--shadow-border)]"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          value={pname}
          onChange={(e) => setPname(e.target.value)}
          placeholder="Proje adı"
          className="h-11 min-w-0 flex-1 rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
        />
        <Button
          size="sm"
          onClick={() => {
            if (!pname.trim()) return;
            const next = [...projects, { id: uid(), region: pregion, name: pname.trim(), clips: [] }];
            setProjects(next);
            saveProjects(next);
            setPname("");
          }}
        >
          Klasör
        </Button>
      </div>
      <ul className="mt-4 space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
            <p className="text-sm font-medium">
              {REGIONS.find((r) => r.id === p.region)?.name} · {p.name}
            </p>
            <label className="mt-2 inline-flex h-9 items-center rounded-full bg-muted px-3 text-xs">
              Video / görsel yükle
              <input
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void fileToDataUrl(file).then((url) => {
                    const clip = {
                      id: uid(),
                      title: file.name,
                      url,
                      kind: file.type.startsWith("video") ? ("video" as const) : ("image" as const),
                    };
                    const next = projects.map((x) => (x.id === p.id ? { ...x, clips: [...x.clips, clip] } : x));
                    setProjects(next);
                    saveProjects(next);
                    toast("Yüklendi");
                  });
                  e.target.value = "";
                }}
              />
            </label>
            <ul className="mt-2 grid grid-cols-3 gap-1">
              {p.clips.map((c) => (
                <li key={c.id}>
                  {c.kind === "video" ? (
                    <video src={c.url} className="aspect-video w-full rounded-lg object-cover" />
                  ) : (
                    <img src={c.url} alt="" className="aspect-video w-full rounded-lg object-cover" />
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
