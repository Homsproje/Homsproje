import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { NAV, SITE } from "@/lib/site";

export function Shell({
  children,
  className,
  footer = true,
}: {
  children: ReactNode;
  className?: string;
  footer?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("min-h-dvh bg-background text-foreground", className)}>
      <header className="sticky top-0 z-40 border-b border-border bg-background pt-14">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLogo to="/site" />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/iletisim"
              className="ml-2 inline-flex h-11 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground"
            >
              Talep bırak
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            <Link
              to="/iletisim"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Talep
            </Link>
            <button
              type="button"
              className="relative z-50 inline-flex size-12 items-center justify-center rounded-lg bg-card"
              aria-expanded={open}
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-12 items-center text-sm text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {children}
      {footer && <SiteFooter />}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 sm:grid-cols-3">
        <div>
          <img src="/brand/logo-stacked.png" alt={SITE.name} className="brand-logo h-24 w-auto object-contain" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{SITE.tagline}</p>
        </div>
        <div>
          <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Sayfalar</p>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-foreground hover:text-muted-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Ofis</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{SITE.city}</li>
            <li>
              <a href={`mailto:${SITE.email}`} className="text-foreground hover:text-muted-foreground">
                {SITE.email}
              </a>
            </li>
            <li>{SITE.domain}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
