import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AppFrame } from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { downloadBrandedImage, downloadUrl, fileBase } from "@/lib/export";
import { lockStaff } from "@/lib/staff";
import { useStudio } from "@/store/studio";

export const Route = createFileRoute("/arsiv")({ component: ArchivePage });

function ArchivePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const chats = projects.filter((p) => (p.thread ?? []).some((t) => t.url) && !p.id.startsWith("demo-"));
  const photos = chats.flatMap((p) =>
    (p.thread ?? []).filter((t) => t.kind === "image" && t.url).map((t) => ({ ...t, title: p.title, pid: p.id })),
  );
  const videos = chats.flatMap((p) =>
    (p.thread ?? []).filter((t) => t.kind === "video" && t.url).map((t) => ({ ...t, title: p.title, pid: p.id })),
  );

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
              Ayarlar
            </Link>
            <h1 className="font-display text-3xl font-medium">Dosyalar</h1>
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

        <h2 className="mt-6 text-sm font-medium">Fotoğraflar</h2>
        {photos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Henüz fotoğraf yok.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {photos.map((t) => (
              <li key={t.id} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
                <Link to="/app" search={{ id: t.pid }}>
                  <img src={t.url} alt="" className="aspect-[4/3] w-full object-cover" />
                </Link>
                <div className="flex items-center justify-between px-2 py-1">
                  <p className="truncate text-[0.7rem]">{t.title}</p>
                  <Button size="sm" variant="ghost" onClick={() => void save(t.url!, "image", t.title)}>
                    <Download />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-8 text-sm font-medium">Videolar</h2>
        {videos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Henüz video yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {videos.map((t) => (
              <li key={t.id} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
                <video src={t.url} controls playsInline className="aspect-video w-full bg-muted" />
                <div className="flex items-center justify-between px-2 py-1">
                  <p className="truncate text-[0.7rem]">{t.title}</p>
                  <Button size="sm" variant="ghost" onClick={() => void save(t.url!, "video", t.title, t.clips)}>
                    <Download />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppFrame>
  );
}
