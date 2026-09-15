import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AppFrame } from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { downloadBrandedImage, downloadUrl, fileBase } from "@/lib/export";
import { lockStaff } from "@/lib/staff";
import { formatDate } from "@/lib/utils";
import { useStudio } from "@/store/studio";

export const Route = createFileRoute("/arsiv")({ component: ArchivePage });

function ArchivePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const chats = projects.filter((p) => (p.thread ?? []).some((t) => t.url) && !p.id.startsWith("demo-"));

  async function save(url: string, kind: "image" | "video", title: string, clips?: string[]) {
    const base = fileBase(kind, title);
    try {
      if (kind === "image") await downloadBrandedImage(url, `${base}.jpg`);
      else if (clips && clips.length > 1) {
        for (let i = 0; i < clips.length; i++) await downloadUrl(clips[i], `${base}-${i + 1}.mp4`);
      } else await downloadUrl(url, `${base}.mp4`);
      toast("İndirme başladı");
    } catch {
      toast.error("İndirilemedi");
    }
  }

  return (
    <AppFrame>
      <main className="h-full overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Link to="/app" className="text-sm text-muted-foreground">
              ← App
            </Link>
            <Link to="/entegrasyon" className="ml-3 text-sm text-muted-foreground">
              API
            </Link>
            <h1 className="font-display text-3xl font-medium">Sohbetler</h1>
          </div>
          <button
            type="button"
            className="text-sm text-muted-foreground"
            onClick={() => {
              lockStaff();
              void navigate({ to: "/" });
            }}
          >
            Çıkış
          </button>
        </div>
        {chats.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Henüz sohbet yok.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {chats.map((p) => {
              const cover = p.assets[0] ?? p.thread.find((t) => t.url);
              const n = p.assets.length || (p.thread ?? []).filter((t) => t.url).length;
              return (
                <li key={p.id}>
                  <Link
                    to="/app"
                    search={{ id: p.id }}
                    className="flex gap-3 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]"
                  >
                    {cover?.url ? (
                      cover.kind === "video" ? (
                        <video src={cover.url} muted playsInline className="h-20 w-28 shrink-0 object-cover" />
                      ) : (
                        <img src={cover.url} alt="" className="h-20 w-28 shrink-0 object-cover" />
                      )
                    ) : (
                      <div className="h-20 w-28 shrink-0 bg-muted" />
                    )}
                    <div className="min-w-0 flex-1 py-3 pr-2">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-kicker uppercase tracking-kicker text-muted-foreground">
                        {n} içerik · {formatDate(p.updatedAt)}
                      </p>
                    </div>
                  </Link>
                  {cover?.url && cover.kind ? (
                    <div className="mt-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void save(cover.url, cover.kind, p.title, cover.clips)}
                      >
                        <Download />
                        İndir
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppFrame>
  );
}
