import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppFrame } from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { getApiSecurity, rotateApiKey, saveApiSecurity, updateStaffPin } from "@/lib/api-security";
import { apiGenerateImage } from "@/lib/homs-api";
import { asOk } from "@/lib/safe";
import { getStaffPin, setSessionMode, setStaffPin, sessionMode } from "@/lib/staff";
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
  const [pin2, setPin2] = useState("");
  const [sess, setSess] = useState<"local" | "session">("local");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testUrl, setTestUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDrive(localStorage.getItem(DRIVE_KEY) ?? "");
      setApiKey(localStorage.getItem(API_KEY) ?? "");
      setSess(sessionMode());
    } catch {
      /* ignore */
    }
    void getApiSecurity().then((s) => {
      if (s.origins?.length) setOrigins(s.origins.join("\n"));
      if (s.rpm) setRpm(s.rpm);
    });
  }, []);

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast("Kopyalandı");
  }

  async function rotate() {
    const res = asOk(await rotateApiKey({ data: { pin: getStaffPin() } }));
    if (!res.ok || !("key" in res) || !res.key) {
      toast.error("error" in res ? res.error : "Anahtar üretilemedi");
      return;
    }
    setApiKey(res.key);
    try {
      localStorage.setItem(API_KEY, res.key);
    } catch {
      /* ignore */
    }
    toast("Yeni anahtar — bir kez kopyalayın");
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
      const res = asOk(await saveApiSecurity({ data: { pin: getStaffPin(), origins: list, rpm } }));
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

  function savePin() {
    if (pin.length < 8) {
      toast.error("En az 8 karakter");
      return;
    }
    if (pin !== pin2) {
      toast.error("Kodlar eşleşmedi");
      return;
    }
    void updateStaffPin({ data: { pin: getStaffPin(), next: pin } }).then((r) => {
      const res = asOk(r);
      if (!res.ok) {
        toast.error("error" in res ? res.error : "Sunucu kaydetmedi");
        return;
      }
      setStaffPin(pin);
      setPin("");
      setPin2("");
      toast("Giriş kodu güncellendi");
    });
  }

  async function test() {
    const token = apiKey || getStaffPin();
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
        <h1 className="mt-2 font-display text-3xl font-medium">API güvenlik</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Anahtar, izinli siteler, hız limiti ve kilit. Kod tarayıcıda saklanmaz; istekler anahtarla gider.
        </p>

        <h2 className="mt-6 text-sm font-medium">API anahtarı</h2>
        <p className="mt-1 break-all rounded-2xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]">
          {apiKey ? (showKey ? apiKey : "homs_live_••••••••") : "Henüz yok — üretin"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void rotate()}>
            Anahtar üret / çevir
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

        <h2 className="mt-6 text-sm font-medium">Giriş kodu</h2>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Yeni kod"
          className="mt-2 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
        />
        <input
          type="password"
          value={pin2}
          onChange={(e) => setPin2(e.target.value)}
          placeholder="Yeniden"
          className="mt-2 h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
        />
        <Button size="sm" variant="outline" className="mt-2" onClick={savePin}>
          Kodu değiştir
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">5 hatalı denemede 15 dk kilit. Kod ekranda gösterilmez.</p>

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
