import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hydrateStaffSession, isStaffSession, lockRemaining, subscribeStaff, unlockStaff } from "@/lib/staff";
import { SITE } from "@/lib/site";
import { useVisualViewport } from "@/lib/use-visual-viewport";

export function StaffGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setOk(isStaffSession());
    void hydrateStaffSession().then((v) => {
      setOk(v || isStaffSession());
      setReady(true);
    });
    return subscribeStaff(() => setOk(isStaffSession()));
  }, []);

  if (!ready) {
    return <div className="min-h-dvh bg-background" />;
  }
  if (!ok) return <StaffLogin />;
  return children;
}

function StaffLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useVisualViewport();

  function tryUnlock() {
    setBusy(true);
    void unlockStaff(code).then((ok) => {
      setBusy(false);
      if (!ok) {
        setError(true);
        if (lockRemaining() > 0) setCode("");
      }
    });
  }

  return (
    <main
      className="flex w-full flex-col items-center justify-center overflow-hidden bg-background px-4"
      style={{ position: "fixed", left: 0, right: 0, top: box.top, height: box.height }}
    >
      <img src="/brand/logo-stacked.png" alt={SITE.name} className="brand-logo h-24 w-auto object-contain" />
      <p className="mt-4 text-kicker uppercase tracking-kicker text-muted-foreground">Homs Proje App</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          tryUnlock();
        }}
        className="mt-5 w-full max-w-xs space-y-3"
        autoComplete="off"
      >
        <div className="space-y-2">
          <Label htmlFor="code">Kod</Label>
          <Input
            id="code"
            name="homs-staff-code"
            type="password"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            value={code}
            className="text-base"
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
          />
        </div>
        {error && (
          <p className="text-sm text-muted-foreground">
            {lockRemaining() > 0 ? `5 hatalı deneme. ${Math.ceil(lockRemaining() / 60)} dk kilit.` : "Kod eşleşmedi."}
          </p>
        )}
        <Button type="button" className="w-full" size="lg" disabled={busy} onClick={tryUnlock}>
          {busy ? "…" : "Giriş"}
        </Button>
      </form>
      <a
        href={`mailto:${SITE.email}?subject=${encodeURIComponent("Homs App kod talebi")}`}
        className="mt-4 text-sm text-muted-foreground underline"
      >
        Şifremi unuttum — e-posta
      </a>
      <Link to="/site" className="mt-3 text-sm text-muted-foreground hover:text-foreground">
        {SITE.domain}
      </Link>
    </main>
  );
}
