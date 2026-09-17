import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { activateMyPlan, getPlans } from "@/lib/membership-api";
import { hydrateStaffSession, isStaffSession, lockRemaining, subscribeStaff, unlockStaff } from "@/lib/staff";
import { SITE } from "@/lib/site";
import { useVisualViewport } from "@/lib/use-visual-viewport";

type PlanOpt = { id: string; name: string; price: number; days: number; terms: string };

export function MemberGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUser();
  const [staffOk, setStaffOk] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tick = () => setStaffOk(isStaffSession());
    tick();
    void hydrateStaffSession().then(() => tick());
    setReady(true);
    return subscribeStaff(tick);
  }, []);

  if (!ready || isPending) return <div className="min-h-dvh bg-background" />;

  // Authenticated Better Auth user OR staff session unlocks the app.
  if (user || staffOk) return children;

  return <MembershipScreen onOk={() => setStaffOk(true)} />;
}

function MembershipScreen({ onOk }: { onOk: () => void }) {
  const box = useVisualViewport();
  const [mode, setMode] = useState<"home" | "login" | "signup" | "admin">("home");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [plans, setPlans] = useState<PlanOpt[]>([]);
  const [plan, setPlan] = useState("aylik");
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPlans().then((res) => {
      if (res.ok && res.plans.length) {
        setPlans(res.plans);
        const paid = res.plans.find((p) => p.id !== "trial");
        if (paid) setPlan(paid.id);
      }
    });
  }, []);

  const visiblePlans = plans.length
    ? plans.filter((p) => p.id !== "trial")
    : [
        { id: "aylik", name: "Aylık", price: 1490, days: 30, terms: "İptal her an. Dönem sonuna kadar erişim." },
        { id: "yillik", name: "Yıllık", price: 12900, days: 365, terms: "Yıllık peşin. 2 ay hediye hesabı." },
      ];

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (!authEnabled) {
        setErr("Kimlik doğrulama bu ortamda kapalı.");
        return;
      }
      const { error } = await authClient.signIn.email({ email: email.trim(), password: pass });
      if (error) {
        setErr(error.message ?? "E-posta veya şifre.");
        return;
      }
      window.location.reload();
    } catch {
      setErr("Giriş başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function doSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (!authEnabled) {
        setErr("Kimlik doğrulama bu ortamda kapalı.");
        return;
      }
      if (pass.length < 6) {
        setErr("Şifre en az 6 karakter olmalı.");
        return;
      }
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password: pass,
        name: name.trim() || email.trim(),
      });
      if (error) {
        setErr(error.message ?? "Kayıt başarısız.");
        return;
      }
      // Attach plan after account exists (no Stripe in Stage-2).
      await activateMyPlan({ data: { planId: plan } });
      window.location.reload();
    } catch {
      setErr("Kayıt başarısız.");
    } finally {
      setBusy(false);
    }
  }

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
        <form className="mt-6 w-full max-w-xs space-y-3" onSubmit={doLogin}>
          <div className="space-y-1">
            <Label>E-posta</Label>
            <Input className="text-base" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1">
            <Label>Şifre</Label>
            <Input className="text-base" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          </div>
          {err ? <p className="text-sm text-muted-foreground">{err}</p> : null}
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? "…" : "Giriş"}
          </Button>
          <button type="button" className="text-sm text-muted-foreground" onClick={() => setMode("home")}>
            Geri
          </button>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form className="mt-6 w-full max-w-xs space-y-3" onSubmit={doSignup}>
          <div className="space-y-1">
            <Label>Ad</Label>
            <Input className="text-base" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-1">
            <Label>E-posta</Label>
            <Input className="text-base" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1">
            <Label>Şifre</Label>
            <Input className="text-base" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
          </div>
          <p className="text-sm font-medium">Üyelik</p>
          <ul className="space-y-2">
            {visiblePlans.map((p) => (
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
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? "…" : "Üye ol"}
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
