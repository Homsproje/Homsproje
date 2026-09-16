import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppFrame } from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { getApiSecurity, rotateApiKey, saveApiSecurity } from "@/lib/api-security";
import { apiGenerateImage } from "@/lib/homs-api";
import { DEFAULT_PLANS, loadPlans, loadUsers, savePlans, type Plan } from "@/lib/members";
import { asOk } from "@/lib/safe";
import { setSessionMode, sessionMode } from "@/lib/staff";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/entegrasyon")({ component: Page });

const DRIVE_KEY = "homs-drive-url";
const API_KEY = "homs-api-key";

function snippetIframe(origin: string) {
  return `<iframe src="${origin}/app" title="Homs Proje App" allow="clipboard-write; microphone" style="width:100%;height:100vh;border:0;background:#fef8ec"></iframe>`;
}

function Page() {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE.url;
  const [drive, setDrive] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [origins, setOrigins] = useState("https://homsproje.com\nhttps://www.homsproje.com");
  const [rpm, setRpm] = useState(30);
  const [pin, setPin] = useState("");
  const [sess, setSess] = useState<"local" | "session">("local");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [users, setUsers] = useState(loadUsers());

  useEffect(() => {
    try {
      setDrive(localStorage.getItem(DRIVE_KEY) ?? "");
      setApiKey(localStorage.getItem(API_KEY) ?? "");
      setSess(sessionMode());
      setPlans(loadPlans());
      setUsers(loadUsers());
    } catch {
      /* ignore */
    }
    void getApiSecurity().then((s) => {
      if (s.origins?.length) setOrigins(s.origins.join("\n"));
      if (s.rpm) setRpm(s.rpm);
      if (s.key) {
        setApiKey(s.key);
        try {
          localStorage.setItem(API_KEY, s.key);
        } catch {
          /* ignore */
        }
      }
    });
  }, []);

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast("Kopyalandı");
  }

  async function rotate() {
    const res = asOk(await rotateApiKey({ data: { pin: pin || "session" } }));
    if (!res.ok || !("key" in res) || !res.key) {
      toast.error("error" in res ? res.error : "Anahtar üretilemedi — yönetici olarak giriş yapın");
      return;
    }
    setApiKey(res.key);
    try {
      localStorage.setItem(API_KEY, res.key);
    } catch {
      /* ignore */
    }
    toast("Kalıcı anahtar hazır — kopyalayın");
  }

  async function saveSec() {
    const list = Array.from(
      new Set([...origins.split(/\s+/).map((s) => s.trim()).filter(Boolean), origin, "https://homsproje.com"]),
    );
    setSaving(true);
    try {
      localStorage.setItem("homs-sec-origins", list.join("\n"));
      localStorage.setItem("homs-sec-rpm", String(rpm));
      setSessionMode(sess);
      const res = asOk(await saveApiSecurity({ data: { pin: pin || "session", origins: list, rpm } }));
      if (!res.ok) {
        toast.error("error" in res ? res.error : "Kaydedilemedi");
        return;
      }
      if ("origins" in res && Array.isArray(res.origins)) setOrigins(res.origins.join("\n"));
      if (!apiKey) await rotate();
      setSavedAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
      toast("Güvenlik kaydedildi");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    const token = apiKey || pin;
    if (!token) {
      toast.error("Önce anahtarı üretin");
      return;
    }
    setBusy(true);
    setTestUrl(null);
    try {
      const res = asOk(
        await apiGenerateImage({
          data: {
            token,
            origin,
            prompt: "Photoreal empty Istanbul living room listing photo, wide, no people, no text.",
            images: [],
            aspectRatio: "16:9",
            resolution: "1k",
          },
        }),
      );
      if (!res.ok || !("url" in res) || !res.url) {
        toast.error("error" in res ? res.error : "API yanıt vermedi");
        return;
      }
      setTestUrl(res.url);
      toast("İstek kabul edildi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppFrame>
      <main className="h-full overflow-y-auto px-4 py-5">
        <Link to="/app" className="text-sm text-muted-foreground">
          ← App
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium">App ayarları</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Yönetici kodu hosting’de HOMS_STAFF_CODE. Imagine için XAI_API_KEY.
        </p>

        <h2 className="mt-6 text-sm font-medium">Üyelik planları</h2>
        <ul className="mt-2 space-y-2">
          {plans.map((p, i) => (
            <li key={p.id} className="rounded-2xl bg-card px-3 py-2 text-sm shadow-[var(--shadow-border)]">
              <input
                value={p.name}
                onChange={(e) => setPlans(plans.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))}
                className="h-10 w-full rounded-full bg-muted px-3 text-base"
              />
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={p.price}
                  onChange={(e) => setPlans(plans.map((x, n) => (n === i ? { ...x, price: Number(e.target.value) || 0 } : x)))}
                  className="h-10 rounded-full bg-muted px-3 text-base"
                />
                <input
                  type="number"
                  value={p.days}
                  onChange={(e) => setPlans(plans.map((x, n) => (n === i ? { ...x, days: Number(e.target.value) || 1 } : x)))}
                  className="h-10 rounded-full bg-muted px-3 text-base"
                />
              </div>
              <input
                value={p.terms}
                onChange={(e) => setPlans(plans.map((x, n) => (n === i ? { ...x, terms: e.target.value } : x)))}
                className="mt-1 h-10 w-full rounded-full bg-muted px-3 text-base"
              />
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          className="mt-2"
          onClick={() => {
            savePlans(plans);
            toast("Planlar kaydedildi");
          }}
        >
          Planları kaydet
        </Button>

        <h2 className="mt-6 text-sm font-medium">Üyeler</h2>
        {users.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Henüz üye yok.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {users.map((u) => (
              <li key={u.email} className="rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-border)]">
                {u.name} · {u.email} · {u.plan} · {new Date(u.until).toLocaleDateString("tr-TR")}
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-6 text-sm font-medium">API anahtarı</h2>
        <p className="mt-1 break-all rounded-2xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]">
          {apiKey ? (showKey ? apiKey : "homs_live_••••••••") : "Yönetici oturumu ile üretin"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void rotate()}>
            Anahtar üret / göster
          </Button>
          {apiKey ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowKey((v) => !v)}>
                {showKey ? "Gizle" : "Göster"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(apiKey)}>
                Kopyala
              </Button>
            </>
          ) : null}
        </div>

        <h2 className="mt-6 text-sm font-medium">İzinli siteler</h2>
        <textarea
          value={origins}
          onChange={(e) => setOrigins(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]"
        />
        <label className="mt-3 flex items-center justify-between text-sm">
          Dakikada istek
          <input
            type="number"
            min={5}
            max={120}
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value) || 30)}
            className="h-10 w-20 rounded-full bg-card px-3 text-center text-base shadow-[var(--shadow-border)]"
          />
        </label>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setSess("local")}
            className={`h-8 rounded-full px-3 text-xs ${sess === "local" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
          >
            Oturum kalsın
          </button>
          <button
            type="button"
            onClick={() => setSess("session")}
            className={`h-8 rounded-full px-3 text-xs ${sess === "session" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
          >
            Sekme kapanınca çıksın
          </button>
        </div>
        <Button size="sm" className="mt-3" disabled={saving} onClick={() => void saveSec()}>
          {saving ? "Kaydediliyor…" : savedAt ? `Kaydedildi · ${savedAt}` : "Güvenliği kaydet"}
        </Button>

        <h2 className="mt-6 text-sm font-medium">Yönetici kodu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kodu değiştirmek için hosting ortamında HOMS_STAFF_CODE yazın, sonra yeniden deploy edin.
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Doğrulama için mevcut kod (isteğe bağlı)"
          className="mt-2 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
        />

        <h2 className="mt-6 text-sm font-medium">homsproje.com</h2>
        <pre className="mt-2 overflow-x-auto rounded-2xl bg-muted p-3 text-[0.7rem]">{snippetIframe(origin)}</pre>
        <Button size="sm" className="mt-2" variant="outline" onClick={() => copy(snippetIframe(origin))}>
          iframe kopyala
        </Button>

        <h2 className="mt-6 text-sm font-medium">Drive</h2>
        <input
          value={drive}
          onChange={(e) => {
            setDrive(e.target.value);
            try {
              localStorage.setItem(DRIVE_KEY, e.target.value);
            } catch {
              /* ignore */
            }
          }}
          placeholder="Google Drive klasör linki"
          className="mt-2 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
        />

        <h2 className="mt-6 text-sm font-medium">Deneme</h2>
        <Button size="sm" className="mt-2" disabled={busy} onClick={() => void test()}>
          {busy ? "…" : "Güvenli istek"}
        </Button>
        {testUrl ? <img src={testUrl} alt="" className="mt-3 max-h-40 w-auto rounded-2xl object-contain" /> : null}
      </main>
    </AppFrame>
  );
}
