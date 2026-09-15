import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { REGIONS } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/talepler")({ component: LeadsPage });

type Lead = {
  name: string;
  email: string;
  phone: string;
  region?: string;
  rooms?: string;
  listing?: string;
  topic?: string;
  message: string;
  at: string;
};

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    try {
      setLeads(JSON.parse(localStorage.getItem("homs-leads") || "[]") as Lead[]);
    } catch {
      setLeads([]);
    }
  }, []);

  return (
    <AppShell footer>
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Homs Proje App</p>
        <h1 className="mt-1 font-display text-4xl font-medium">Talepler</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Siteden gelen formlar bu tarayıcıda durur. Beklentiyi okuyun, uygun projeleri hazırlayın.
        </p>

        {leads.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">Henüz talep yok.</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {leads.map((l, i) => {
              const region = REGIONS.find((r) => r.id === l.region);
              return (
                <li key={`${l.at}-${i}`} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-border)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-medium">{l.name}</h2>
                    <p className="text-kicker uppercase tracking-kicker text-muted-foreground">{formatDate(l.at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {l.phone}
                    {l.email ? ` · ${l.email}` : ""}
                    {region ? ` · ${region.name}` : ""}
                    {l.rooms ? ` · ${l.rooms}` : ""}
                  </p>
                  {l.message ? <p className="mt-3 text-sm">{l.message}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
