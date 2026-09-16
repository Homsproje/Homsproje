import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isMemberOk, loadPlans, loginMember, signupMember } from "@/lib/members";
import { hydrateStaffSession, isStaffSession, lockRemaining, subscribeStaff, unlockStaff } from "@/lib/staff";
import { SITE } from "@/lib/site";
import { useVisualViewport } from "@/lib/use-visual-viewport";

export function MemberGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const tick = () => setOk(isMemberOk() || isStaffSession());
    tick();
    void hydrateStaffSession().then(() => tick());
    setReady(true);
    return subscribeStaff(tick);
  }, []);

  if (!ready) return <div className="min-h-dvh bg-background" />;
  if (!ok) return <MembershipScreen onOk={() => setOk(true)} />;
  return children;
}

function MembershipScreen({ onOk }: { onOk: () => void }) {
  const box = useVisualViewport();
  const plans = loadPlans();
  const [mode, setMode] = useState<"home" | "login" | "signup" | "admin">("home");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState(plans.find((p) => p.id !== "trial")?.id ?? "aylik");
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main
      className="flex w-full flex-col items-center overflow-y-auto bg-background px-4 py-8"
      style={{ position: "fixed", left: 0, right: 0, top: box.top, height: box.height }}
    >
      <img src="/brand/logo-stacked.png" alt={SITE.name} className="brand-logo h-20 w-auto object-contain" />
      <p className="mt-3 text-kicker uppercase tracking-kicker text-muted-foreground">Homs Proje App</p>

      {mode === "home" ? (
        <div className="mt-6 w-full max-w-xs space-y-2">
          <Button className="w-full" size="lg" onClick={() => setMode("login")}>
            Giriş yap
          </Button>
          <Button className="w-full" size="lg" variant="outline" onClick={() => setMode("signup")}>
            Üyelik oluştur
          </Button>
          <button type="button" className="block w-full pt-3 text-sm text-muted-foreground" onClick={() => setMode("admin")}>
            Yönetici
          </button>
        </div>
      ) : null}

      {mode === "login" ? (
        <form
          className="mt-6 w-full max-w-xs space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const res = loginMember(email, pass);
            if (res.ok) onOk();
            else setErr(res.error);
          }}
        >
          <div className="space-y-1">
            <Label>E-posta</Label>
            <Input className="text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Şifre</Label>
            <Input className="text-base" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          {err ? <p className="text-sm text-muted-foreground">{err}</p> : null}
          <Button className="w-full" type="submit">
            Giriş
          </Button>
          <button type="button" className="text-sm text-muted-foreground" onClick={() => setMode("home")}>
            Geri
          </button>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form
          className="mt-6 w-full max-w-xs space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const res = signupMember(name, email, pass, plan);
            if (res.ok) onOk();
            else setErr(res.error);
          }}
        >
          <div className="space-y-1">
            <Label>Ad</Label>
            <Input className="text-base" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>E-posta</Label>
            <Input className="text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Şifre</Label>
            <Input className="text-base" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <p className="text-sm font-medium">Üyelik</p>
          <ul className="space-y-2">
            {plans.filter((p) => p.id !== "trial").map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`w-full rounded-2xl px-3 py-3 text-left text-sm shadow-[var(--shadow-border)] ${plan === p.id ? "bg-foreground text-background" : "bg-card"}`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2">{p.price ? `${p.price.toLocaleString("tr-TR")} ₺` : "Ücretsiz"}</span>
                  <span className={`mt-1 block text-xs ${plan === p.id ? "opacity-80" : "text-muted-foreground"}`}>{p.terms}</span>
                </button>
              </li>
            ))}
          </ul>
          {err ? <p className="text-sm text-muted-foreground">{err}</p> : null}
          <Button className="w-full" type="submit">
            Üye ol
          </Button>
          <button type="button" className="text-sm text-muted-foreground" onClick={() => setMode("home")}>
            Geri
          </button>
        </form>
      ) : null}

      {mode === "admin" ? (
        <form
          className="mt-6 w-full max-w-xs space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void unlockStaff(code).then((ok) => {
              setBusy(false);
              if (ok) onOk();
              else setErr(lockRemaining() > 0 ? "Kilitli." : "Kod eşleşmedi.");
            });
          }}
        >
          <Label>Yönetici kodu</Label>
          <Input className="text-base" type="password" value={code} onChange={(e) => setCode(e.target.value)} />
          {err ? <p className="text-sm text-muted-foreground">{err}</p> : null}
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? "…" : "Giriş"}
          </Button>
          <button type="button" className="text-sm text-muted-foreground" onClick={() => setMode("home")}>
            Geri
          </button>
        </form>
      ) : null}

      <Link to="/site" className="mt-6 text-sm text-muted-foreground">
        {SITE.domain}
      </Link>
    </main>
  );
}
