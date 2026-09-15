import { type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/layout/logo";
import { StaffGate } from "@/components/layout/staff-gate";
import { lockStaff } from "@/lib/staff";
import { APP_NAV } from "@/lib/site";

export function AppShell({ children, footer = false }: { children: ReactNode; footer?: boolean }) {
  const navigate = useNavigate();

  return (
    <StaffGate>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
            <div className="flex items-center gap-3">
              <BrandLogo to="/app" />
              <span className="hidden text-kicker uppercase tracking-kicker text-muted-foreground sm:inline">App</span>
            </div>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {APP_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex h-11 shrink-0 items-center px-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                className="inline-flex h-11 shrink-0 items-center px-3 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  lockStaff();
                  void navigate({ to: "/" });
                }}
              >
                Çıkış
              </button>
            </nav>
          </div>
        </header>
        {children}
        {footer ? (
          <p className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
            Homs Proje App — yalnızca ofis
          </p>
        ) : null}
      </div>
    </StaffGate>
  );
}
