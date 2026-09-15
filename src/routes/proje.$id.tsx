import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Compare } from "@/components/studio/compare";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateStudioImage, pollStudioVideo, startStudioVideo } from "@/lib/ai";
import { MODES, STYLES, VIEWS, buildImagePrompt, buildVideoPrompt, type ViewId } from "@/lib/prompts";
import { errText } from "@/lib/error-component";
import { downloadBrandedImage, downloadUrl, fileBase } from "@/lib/export";
import { formatDate, toApiImage } from "@/lib/utils";
import { useStudio } from "@/store/studio";

export const Route = createFileRoute("/proje/$id")({
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const project = useStudio((s) => s.projects.find((p) => p.id === id));
  const addAsset = useStudio((s) => s.addAsset);
  const removeProject = useStudio((s) => s.removeProject);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);

  const views = useMemo(
    () => (project ? VIEWS.filter((v) => v.modes.includes(project.mode)) : []),
    [project],
  );

  if (!project) {
    return (
      <AppShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Proje bulunamadı</h1>
          <p className="mt-2 text-sm text-muted-foreground">Bu kayıt bu tarayıcıda yok.</p>
          <Button asChild className="mt-6">
            <Link to="/app">İşlere dön</Link>
          </Button>
        </main>
      </AppShell>
    );
  }

  const asset = project.assets[active] ?? project.assets[0];
  const source = project.sources[0];
  const styleLabel = STYLES.find((s) => s.id === project.style)?.label;
  const modeLabel = MODES.find((m) => m.id === project.mode)?.label;

  async function extraView(view: ViewId) {
    if (!project) return;
    setBusy(true);
    try {
      const prompt = buildImagePrompt({
        mode: project.mode,
        style: project.style,
        view,
        brief: project.brief,
        hasSource: project.sources.length > 0,
      });
      const refs = [...project.sources.map((s) => s.url), asset?.kind === "image" ? asset.url : ""]
        .filter(Boolean)
        .slice(0, 3);
      const res = await generateStudioImage({
        data: {
          prompt,
          images: await Promise.all(refs.map((u) => toApiImage(u))),
          aspectRatio: view === "isometric" ? "4:3" : "16:9",
        },
      });
      if (!res.ok) {
        toast.error(errText(res.error));
        return;
      }
      addAsset(project.id, { kind: "image", url: res.url, prompt, view });
      setActive(0);
      toast("Yeni açı eklendi");
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setBusy(false);
    }
  }

  async function makeVideo() {
    if (!project || !asset || asset.kind !== "image") {
      toast.error("Video için bir görsel seçin.");
      return;
    }
    setBusy(true);
    try {
      const prompt = buildVideoPrompt({ mode: project.mode, view: asset.view, brief: project.brief });
      const started = await startStudioVideo({
        data: { prompt, image: await toApiImage(asset.url), duration: 6 },
      });
      if (!started.ok) {
        toast.error(errText(started.error));
        return;
      }
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const polled = await pollStudioVideo({ data: { requestId: started.requestId } });
        if (!polled.ok) {
          toast.error(errText(polled.error));
          return;
        }
        if (polled.status === "done" && "url" in polled && polled.url) {
          addAsset(project.id, { kind: "video", url: polled.url, prompt, view: asset.view });
          setActive(0);
          toast("Video tur hazır");
          return;
        }
      }
      toast.error("Video zaman aşımı.");
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" aria-label="Geri">
              <Link to="/app">
                <ArrowLeft />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-medium sm:text-3xl">{project.title}</h1>
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                {modeLabel} · {styleLabel} · {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {asset && (
              <Button
                variant="outline"
                onClick={() => {
                  const base = fileBase(asset.kind, project.title);
                  void (asset.kind === "image"
                    ? downloadBrandedImage(asset.url, `${base}.jpg`)
                    : downloadUrl(asset.url, `${base}.mp4`));
                }}
              >
                <Download />
                İndir
              </Button>
            )}
            <Button variant="outline" disabled={busy} onClick={() => void makeVideo()}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              Videoya çevir
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                removeProject(project.id);
                navigate({ to: "/app" });
              }}
            >
              <Trash2 />
              Sil
            </Button>
          </div>
        </div>

        {!asset ? (
          <p className="text-sm text-muted-foreground">Bu projede henüz görsel yok.</p>
        ) : asset.kind === "video" ? (
          <video
            src={asset.url}
            controls
            autoPlay
            loop
            playsInline
            className="w-full overflow-hidden rounded-[1.5rem] bg-muted shadow-[var(--shadow-border)]"
          />
        ) : source ? (
          <Compare before={source.url} after={asset.url} />
        ) : (
          <img
            src={asset.url}
            alt={project.title}
            className="w-full rounded-[1.5rem] object-cover shadow-[var(--shadow-border)]"
          />
        )}

        {project.assets.length > 1 && (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {project.assets.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`block w-full overflow-hidden rounded-xl ${i === active ? "ring-2 ring-ring" : ""}`}
                >
                  {a.kind === "video" ? (
                    <video src={a.url} muted className="aspect-video w-full object-cover" />
                  ) : (
                    <img src={a.url} alt="" className="aspect-video w-full object-cover" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-8">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">Başka bir açı</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {views.map((v) => (
              <Button key={v.id} variant="outline" size="sm" disabled={busy} onClick={() => void extraView(v.id)}>
                {v.label}
              </Button>
            ))}
          </div>
        </section>

        {project.brief && (
          <p className="mt-8 max-w-xl text-sm text-muted-foreground">
            <Badge>Brief</Badge>
            <span className="mt-2 block">{project.brief}</span>
          </p>
        )}
      </main>
    </AppShell>
  );
}
