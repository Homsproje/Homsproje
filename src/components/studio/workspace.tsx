import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Folder, ImagePlus, KeyRound, Loader2, Mic, Plus, Send, X, Check } from "lucide-react";
import { toast } from "sonner";
import { ClipPlayer } from "@/components/studio/clip-player";
import { ChatActions, ImageEditOverlay } from "@/components/studio/image-edit-overlay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateStudioImage,
  pollStudioVideo,
  startStudioVideo,
} from "@/lib/ai";
import { CATALOG, type CatalogId } from "@/lib/catalog";
import { downloadBrandedImage, downloadImageAspect, downloadUrl, fileBase } from "@/lib/export";
import { errText } from "@/lib/error-component";
import { scoreEmpty } from "@/lib/intent";
import { buildImagePrompt, parseCommand } from "@/lib/homs-engine";
import { CAMERAS, ZONES, AUDIO, buildDirectorPrompt, type CameraId, type ZoneId, type AudioId } from "@/lib/director";
import { CarouselOverlay } from "@/components/studio/carousel";
import { asOk } from "@/lib/safe";
import { fileToDataUrl, toApiImage, uid } from "@/lib/utils";
import { useStudio, type ChatTurn, type SourceImage } from "@/store/studio";

const ASPECTS = ["16:9", "4:3", "1:1", "9:16", "3:4"] as const;
const GEN_ROOM = [
  { id: "", label: "Otomatik" },
  { id: "living room listing photo", label: "Salon" },
  { id: "kitchen", label: "Mutfak" },
  { id: "bedroom", label: "Yatak" },
  { id: "bathroom", label: "Banyo" },
  { id: "building facade exterior", label: "Cephe" },
  { id: "garden terrace landscape", label: "Bahçe" },
  { id: "photoreal 3D floor plan", label: "Kat planı" },
] as const;
const GEN_LIGHT = [
  { id: "", label: "Işık auto" },
  { id: "clear midday daylight", label: "Gündüz" },
  { id: "golden hour warm sun", label: "Golden" },
  { id: "evening 2700K interior lighting", label: "Akşam" },
  { id: "blue hour dusk with interior lamps", label: "Alacakaranlık" },
  { id: "night city glow through windows", label: "Gece" },
] as const;
const GEN_LENS = [
  { id: "", label: "Lens auto" },
  { id: "wide 24mm full-room listing shot", label: "Geniş" },
  { id: "eye-level 35mm", label: "Göz hizası" },
  { id: "slightly low angle, still full room", label: "Alçak" },
  { id: "closer 50mm of the seating, still interior", label: "Yakın" },
] as const;
const GEN_LOOK = [
  { id: "", label: "Foto" },
  { id: "photoreal listing photograph", label: "Listing" },
  { id: "high-end architectural CGI render", label: "Render" },
  { id: "isometric 3D dollhouse", label: "3D" },
  { id: "soft editorial magazine still", label: "Magazin" },
] as const;
const DURATIONS = [
  { sec: 6, label: "6 sn" },
  { sec: 10, label: "10 sn" },
  { sec: 15, label: "15 sn" },
  { sec: 30, label: "30 sn" },
  { sec: 60, label: "1 dk" },
  { sec: 90, label: "1:30" },
  { sec: 120, label: "2 dk" },
] as const;

async function waitForVideo(requestId: string) {
  for (let i = 0; i < 28; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    const polled = asOk(await pollStudioVideo({ data: { requestId } }));
    if (!polled.ok) return polled;
    if ("status" in polled && polled.status === "done" && "url" in polled && polled.url) return polled;
  }
  return { ok: false as const, error: "Video zaman aşımı. 15 sn ile yeniden deneyin." };
}

function aspectFrom(text: string, fallback: (typeof ASPECTS)[number]): (typeof ASPECTS)[number] {
  if (/9:16|dikey|reels|story|hikâye/.test(text)) return "9:16";
  if (/3:4|porte/.test(text)) return "3:4";
  if (/1:1|kare/.test(text)) return "1:1";
  if (/4:3|manzara/.test(text)) return "4:3";
  if (/16:9|yatay|geniş/.test(text)) return "16:9";
  return fallback;
}

function splitSources(sources: SourceImage[], count: number) {
  const taggedRooms = sources.filter((s) => s.role === "room");
  const taggedRefs = sources.filter((s) => s.role === "ref");
  if (taggedRooms.length) {
    return { rooms: taggedRooms, refs: taggedRefs.length ? taggedRefs : sources.filter((s) => s.role !== "room") };
  }
  const empty = sources.filter((s) => (s.emptyScore ?? 0) >= 0.42);
  const furn = sources.filter((s) => (s.emptyScore ?? 0) < 0.42);
  if (empty.length) return { rooms: empty, refs: furn };
  if (sources.length > count) return { rooms: sources.slice(0, count), refs: sources.slice(count) };
  return { rooms: sources, refs: [] as SourceImage[] };
}

export function Workspace({ chatIdFromUrl }: { chatIdFromUrl?: string }) {
  const navigate = useNavigate();
  const createProject = useStudio((s) => s.createProject);
  const addAsset = useStudio((s) => s.addAsset);
  const addTurn = useStudio((s) => s.addTurn);
  const removeTurnStore = useStudio((s) => s.removeTurn);
  const getProject = useStudio((s) => s.getProject);

  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl ?? null);
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("16:9");
  const [resolution, setResolution] = useState<"1k" | "2k">("1k");
  const [duration, setDuration] = useState(10);
  const [text, setText] = useState("");
  const [sources, setSources] = useState<SourceImage[]>([]);
  const [busy, setBusy] = useState<"image" | "video" | "save" | null>(null);
  const [videoPanel, setVideoPanel] = useState(false);
  const [videoFrom, setVideoFrom] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [camera, setCamera] = useState<CameraId>("dolly");
  const [zones, setZones] = useState<ZoneId[]>(["curtains"]);
  const [intensity, setIntensity] = useState<"low" | "mid">("low");
  const [audio, setAudio] = useState<AudioId>("mute");
  const [extendShot, setExtendShot] = useState(false);
  const [endFrom, setEndFrom] = useState<string | null>(null);
  const [carousel, setCarousel] = useState<string[] | null>(null);
  const [menu, setMenu] = useState<CatalogId | null>(null);
  const [dlPanel, setDlPanel] = useState(false);
  const [editor, setEditor] = useState<null | "paint" | "comment" | "resize">(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [phase, setPhase] = useState<Record<string, "edit" | "review" | "done">>({});
  const [openFmt, setOpenFmt] = useState<"aspect" | "quality" | "gen" | null>(null);
  const [listening, setListening] = useState(false);
  const [hintShift, setHintShift] = useState(0);
  const [shot, setShot] = useState<"1" | "2c" | "2a">("1");
  const [count, setCount] = useState(1);
  const [genRoom, setGenRoom] = useState("");
  const [genLight, setGenLight] = useState("");
  const [genLens, setGenLens] = useState("");
  const [genLook, setGenLook] = useState("");
  const [frame, setFrame] = useState<"wide" | "mid" | "close">("mid");
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localTurns, setLocalTurns] = useState<ChatTurn[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stored = useStudio((s) => (chatId ? s.projects.find((p) => p.id === chatId)?.thread : undefined));
  const turns = stored && stored.length ? stored : localTurns;
  const selected = turns.find((t) => t.id === selectedId) ?? [...turns].reverse().find((t) => t.kind === "image" && t.url);

  useEffect(() => {
    setChatId(chatIdFromUrl ?? null);
    if (!chatIdFromUrl) {
      setLocalTurns([]);
      setSources([]);
      setSelectedId(null);
      setVideoPanel(false);
    }
  }, [chatIdFromUrl]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns.length, busy]);

  function remember(id: string, turn: Omit<ChatTurn, "id" | "createdAt">) {
    const next = { ...turn, id: uid(), createdAt: new Date().toISOString() };
    addTurn(id, turn);
    setLocalTurns((prev) => [...prev, next]);
    if (turn.url) setSelectedId(next.id);
    return next;
  }

  function ensureChat(title: string) {
    if (chatId && getProject(chatId)) return chatId;
    const p = createProject({
      title: title.slice(0, 48) || "Sohbet",
      mode: "furnish",
      style: "warm",
      view: "living",
      brief: title,
      sources: [],
    });
    setChatId(p.id);
    void navigate({ to: "/app", search: { id: p.id }, replace: true });
    return p.id;
  }

  async function ingest(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 20 - sources.length);
    if (!list.length) return;
    const added = await Promise.all(
      list.map(async (file) => {
        const url = await fileToDataUrl(file);
        const emptyScore = await scoreEmpty(url);
        return { id: uid(), url, name: file.name, emptyScore, role: emptyScore >= 0.42 ? "room" : "ref" } satisfies SourceImage;
      }),
    );
    setSources((s) => [...s, ...added].slice(0, 20));
  }

  async function runImages(instruction: string, editUrl?: string) {
    setBusy("image");
    setProgress("Görsel…");
    const id = ensureChat(instruction);
    remember(id, { role: "user", text: /Şunları|Not \d|Apply |Edit ONLY|Kadraj|Revize/.test(instruction) ? "Revize" : instruction });
    const cmd = parseCommand(instruction);
    const ar = cmd.aspect ?? aspectFrom(instruction, aspect);
    try {
      const shotCount = Math.min(4, Math.max(1, count));
      const { rooms, refs } = splitSources(sources, shotCount);
      const lastImg = [...turns].reverse().find((t) => t.kind === "image" && t.url)?.url;
      const resultUrl =
        editUrl ||
        (selected?.kind === "image" && selected.role === "assistant" ? selected.url : undefined) ||
        lastImg;
      const fresh =
        !editUrl &&
        cmd.kind === "furnish" &&
        rooms.length > 0 &&
        /döşe|dose|boş |bos |orijinal/.test(instruction.toLocaleLowerCase("tr-TR"));
      const revising = Boolean(resultUrl) && (Boolean(editUrl) || cmd.kind === "revise" || cmd.kind === "empty" || (!fresh && cmd.kind === "furnish"));
      const jobs =
        revising && resultUrl
          ? Array.from({ length: shotCount }, () => ({ url: resultUrl }))
          : cmd.kind === "facade" || cmd.kind === "garden" || cmd.kind === "plan" || /facade|garden|floor plan/.test(genRoom)
            ? sources.slice(0, 1)
            : (rooms.length ? rooms : sources.slice(0, 1)).slice(0, Math.max(1, shotCount));
      const styleRefs = revising || cmd.kind === "empty" || cmd.kind === "plan" ? [] : refs.slice(0, 2);

      for (let i = 0; i < jobs.length; i++) {
        setProgress(`${i + 1} / ${jobs.length}`);
        const room = jobs[i];
        const images: string[] = [];
        if (room?.url) images.push(await toApiImage(room.url));
        for (const ref of styleRefs) {
          if (ref.url !== room?.url && images.length < 3) images.push(await toApiImage(ref.url));
        }
        if (!images.length && selected?.url) images.push(await toApiImage(selected.url));

      const kind = /facade/.test(genRoom)
        ? "facade"
        : /garden|terrace/.test(genRoom)
          ? "garden"
          : /floor plan|dollhouse/.test(genRoom)
            ? "plan"
            : revising
              ? "revise"
              : cmd.kind === "video"
                ? "furnish"
                : cmd.kind;
      const prompt = [
          buildImagePrompt({
            kind,
            text: instruction,
            index: i,
            total: jobs.length,
            hasRefs: styleRefs.length > 0,
          }),
          `Output EXACTLY ${ar} aspect ratio.`,
          genRoom ? `Subject: ${genRoom}.` : "",
          genLight ? `Lighting: ${genLight}.` : "",
          genLens ? `Camera: ${genLens}.` : "",
          genLook ? `Look: ${genLook}.` : "",
          frame === "close"
            ? "Slightly closer view of the same room, still a full interior."
            : frame === "wide"
              ? "Wider full-room listing shot, same architecture."
              : "",
          shotCount > 1 ? `Alternative ${i + 1} of ${shotCount}. Same camera, different furnishing concept. Do not merge rooms.` : "",
        ]
          .filter(Boolean)
          .join(" ");
        const res = asOk(
          await generateStudioImage({
            data: { prompt, images, aspectRatio: ar, resolution },
          }),
        );
        if (!res.ok) {
          toast.error(errText("error" in res ? res.error : "Üretim başarısız"));
          remember(id, { role: "assistant", text: errText("error" in res ? res.error : "Üretim başarısız") });
          continue;
        }
        if (!("url" in res) || !res.url) continue;
        addAsset(id, { kind: "image", url: res.url, prompt, view: "living", title: instruction.slice(0, 40) });
        const saved = remember(id, {
          role: "assistant",
          text: jobs.length > 1 ? `${i + 1} / ${jobs.length}` : "",
          url: res.url,
          kind: "image",
        });
        setPhase((p) => ({ ...p, [saved.id]: revising ? "done" : "edit" }));
        setMenu("ai");
        setPicks([]);
        setMenu(null);
      }
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setBusy(null);
      setProgress("");
    }
  }

  function openVideo(url: string) {
    setVideoFrom(url);
    setVideoPanel(true);
  }

  async function runVideo(instruction: string, fromUrl?: string) {
    const still = fromUrl ?? videoFrom ?? selected?.url;
    if (!still) {
      toast.error("Videoya çevirmek için üretilen görsele dokunun.");
      return;
    }
    setBusy("video");
    const id = ensureChat(instruction);
    remember(id, { role: "user", text: instruction });
    const scenes = Math.min(4, Math.max(1, Math.ceil(Math.min(duration, 60) / 15)));
    const clipLen = Math.min(15, duration);
    const ar = aspectFrom(instruction, aspect);
    const made: string[] = [];
    const parsed = parseCommand(instruction);
    try {
      for (let i = 0; i < scenes; i++) {
        setProgress(`Sahne ${i + 1}/${scenes}`);
        const started = asOk(
          await startStudioVideo({
            data: {
              prompt: buildDirectorPrompt({
                camera: parsed.camera ?? (/cephe|dış|disari|bahçe/i.test(instruction) ? "facade" : camera),
                zones: parsed.zones.length ? parsed.zones : zones,
                intensity: parsed.intensity ?? intensity,
                audio,
                extend: extendShot || i > 0,
                endHint: endFrom ? "the second selected interior, same apartment" : undefined,
                brief: instruction,
              }),
              image: await toApiImage(still),
              duration: clipLen,
              aspectRatio: ar === "9:16" ? "9:16" : "16:9",
            },
          }),
        );
        if (!started.ok) {
          toast.error(errText("error" in started ? started.error : "Video başlamadı"));
          remember(id, { role: "assistant", text: errText("error" in started ? started.error : "Video başlamadı") });
          return;
        }
        if (!("requestId" in started) || !started.requestId) {
          toast.error("Video isteği yok.");
          return;
        }
        const polled = await waitForVideo(started.requestId);
        if (!polled.ok || !("url" in polled) || !polled.url) {
          toast.error(polled.ok ? "Video yok." : errText("error" in polled ? polled.error : "Video yok"));
          remember(id, {
            role: "assistant",
            text: errText("error" in polled ? polled.error : "Video yok"),
          });
          return;
        }
        made.push(polled.url);
      }
      addAsset(id, { kind: "video", url: made[0], clips: made, prompt: instruction, view: "living" });
      remember(id, {
        role: "assistant",
        text: made.length > 1 ? `${made.length} sahne` : "",
        url: made[0],
        clips: made,
        kind: "video",
        suggestions: undefined,
      });
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setBusy(null);
      setProgress("");
      setVideoPanel(false);
    }
  }

  function submit(instruction: string) {
    let next = instruction.trim();
    if (busy) return;
    if (!next) {
      if (picks.length) {
        const url = selected?.kind === "image" ? selected.url : [...turns].reverse().find((t) => t.kind === "image")?.url;
        void runImages(`Şunları aynı geniş oda karesinde uygula, kadrajı değiştirme: ${picks.join("; ")}`, url);
        setPicks([]);
        setText("");
        return;
      }
      if (sources.length) next = "Yüklenen boş odayı stile göre döşe, mimariyi koru.";
      else return;
    }
    setText("");
    const cmd = parseCommand(next);
    if (cmd.aspect) setAspect(cmd.aspect);
    if (cmd.camera) setCamera(cmd.camera);
    if (cmd.zones.length) setZones(cmd.zones);
    if (cmd.duration) setDuration(cmd.duration);
    if (cmd.intensity) setIntensity(cmd.intensity);

    if (cmd.kind === "video" || next === "Videoya çevir") {
      if (!selected?.url) {
        toast.error("Videoya çevirmek için üretilen görsele dokunun.");
        return;
      }
      if (!cmd.camera && next.toLocaleLowerCase("tr-TR").includes("video")) {
        openVideo(selected.url);
        return;
      }
      void runVideo(next, selected.url);
      return;
    }
    void runImages(next);
  }

  async function saveTurn(turn: ChatTurn) {
    if (!turn.url || !turn.kind) return;
    const base = fileBase(turn.kind, turn.text || "homs");
    setBusy("save");
    toast("İndiriliyor…");
    try {
      if (turn.kind === "image") await downloadBrandedImage(turn.url, `${base}.jpg`);
      else if (turn.clips && turn.clips.length > 1) {
        for (let i = 0; i < turn.clips.length; i++) await downloadUrl(turn.clips[i], `${base}-${i + 1}.mp4`);
      } else await downloadUrl(turn.url, `${base}.mp4`);
      toast("Kayıt hazır — cihaz, Drive veya Fotoğraflar’dan seçin.");
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setBusy(null);
    }
  }

  const lastImageId = [...turns].reverse().find((t) => t.role === "assistant" && t.kind === "image" && t.url)?.id;
  const imageIds = turns.filter((t) => t.role === "assistant" && t.kind === "image" && t.url).map((t) => t.id);
  const toolId =
    selectedId && turns.some((t) => t.id === selectedId && t.kind === "image") ? selectedId : lastImageId;

  function listenVoice() {
    const w = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) {
      toast.error("Bu tarayıcıda ses yok.");
      return;
    }
    const rec = new Rec();
    rec.lang = "tr-TR";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (ev: { results: { 0: { 0: { transcript: string } } } }) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      if (said) setText((cur) => (cur ? `${cur} ${said}` : said));
    };
    rec.start();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <ol className="mx-auto flex max-w-2xl flex-col gap-4 pb-3">
          {turns.length === 0 ? (
            <li className="rounded-2xl bg-card px-4 py-5 text-sm shadow-[var(--shadow-border)]">
              <p className="font-medium">Homs Proje App</p>
              <p className="mt-1 text-muted-foreground">Boş oda yükleyin, döşeyin, videoya çevirin.</p>
              <Link to="/entegrasyon" className="mt-3 inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm text-background">
                API güvenlik
              </Link>
            </li>
          ) : null}
          {turns.map((t) => (
            <li key={t.id}>
              {t.text ? (
                <>
                  <p className="text-kicker uppercase tracking-kicker text-subtle">
                    {t.role === "user" ? "Siz" : "Homs"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {t.text.startsWith("Şunları") ? "Revize" : t.text}
                  </p>
                </>
              ) : null}
              {t.kind === "video" && t.url ? (
                <button type="button" className="mt-2 mx-auto block max-w-full" onClick={() => setFullUrl(t.url!)}>
                  <ClipPlayer clips={t.clips?.length ? t.clips : [t.url]} />
                </button>
              ) : t.url ? (
                <button
                  type="button"
                  className="relative mt-2 mx-auto block max-w-full"
                  onClick={() => {
                    if (selectedId === t.id) setFullUrl(t.url!);
                    else {
                      setSelectedId(t.id);
                      setPhase((p) => ({ ...p, [t.id]: p[t.id] ?? "edit" }));
                    }
                  }}
                >
                  <img
                    src={t.url}
                    alt=""
                    className={`mx-auto max-h-[28vh] w-auto max-w-full rounded-2xl object-contain ${
                      selectedId === t.id ? "ring-2 ring-foreground" : ""
                    }`}
                  />
                  {t.role === "assistant" && imageIds.includes(t.id) ? (
                    <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-foreground text-xs text-background">
                      {imageIds.indexOf(t.id) + 1}
                    </span>
                  ) : null}
                </button>
              ) : null}
              {t.role === "assistant" && t.kind === "image" && t.url && t.id === toolId ? (
                <>
                {imageIds.length > 1 ? (
                  <div className="mt-2 flex gap-1.5">
                    {imageIds.map((id, i) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedId(id);
                          setPhase((p) => ({ ...p, [id]: p[id] ?? "edit" }));
                        }}
                        className={`grid size-9 place-items-center rounded-full text-sm ${
                          (selectedId ?? toolId) === id ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
                <ImageTools
                  turn={t}
                  phase={phase[t.id] ?? "edit"}
                  menu={menu}
                  picks={picks}
                  hintShift={hintShift}
                  busy={Boolean(busy)}
                  onMenu={(id) => {
                    setSelectedId(t.id);
                    setMenu(menu === id ? null : id);
                    setVideoPanel(false);
                  }}
                  onTogglePick={(h) =>
                    setPicks((cur) => (cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h]))
                  }
                  onApply={() => {
                    setSelectedId(t.id);
                    if (!picks.length) {
                      setPhase((p) => ({ ...p, [t.id]: "done" }));
                      return;
                    }
                    void runImages(
                      `Şunları aynı geniş oda karesinde uygula, kadrajı değiştirme: ${picks.join("; ")}`,
                      t.url,
                    );
                  }}
                  onAccept={() => {
                    setPhase((p) => ({ ...p, [t.id]: "done" }));
                    setMenu(null);
                    setPicks([]);
                  }}
                  onReject={() => {
                    setPhase((p) => ({ ...p, [t.id]: "edit" }));
                    setHintShift((n) => n + 4);
                    setPicks([]);
                    setMenu("ai");
                  }}
                  onDownload={() => void saveTurn(t)}
                  onVideo={() => {
                    setSelectedId(t.id);
                    openVideo(t.url!);
                  }}
                  onCarousel={() => {
                    const urls = turns.filter((x) => x.kind === "image" && x.url).map((x) => x.url!);
                    if (urls.length < 2) toast("Karusel için en az 2 görsel üretin.");
                    else setCarousel(urls);
                  }}
                  onRevise={() => {
                    setSelectedId(t.id);
                    setPhase((p) => ({ ...p, [t.id]: "edit" }));
                    setHintShift((n) => n + 5);
                    setPicks([]);
                    setMenu("ai");
                    setDlPanel(false);
                  }}
                  saving={busy === "save"}
                  shot={shot}
                  frame={frame}
                  onShot={setShot}
                  onFrame={setFrame}
                  onExpand={() => setFullUrl(t.url!)}
                  dlOpen={dlPanel && selectedId === t.id}
                  onDl={() => setDlPanel((v) => !v)}
                  onDlSize={(a) => {
                    void (async () => {
                      setBusy("save");
                      try {
                        await downloadImageAspect(t.url!, `${fileBase("image", "homs")}.jpg`, a);
                        toast("İndirme");
                      } catch (err) {
                        toast.error(errText(err));
                      } finally {
                        setBusy(null);
                      }
                    })();
                  }}
                />
                <ChatActions
                  onEdit={() => {
                    setSelectedId(t.id);
                    setEditor("paint");
                  }}
                  onComment={() => {
                    setSelectedId(t.id);
                    setEditor("comment");
                  }}
                  onResize={() => {
                    setSelectedId(t.id);
                    setEditor("resize");
                  }}
                  onRemove={() => {
                    if (chatId) removeTurnStore(chatId, t.id);
                    setLocalTurns((prev) => prev.filter((x) => x.id !== t.id));
                    setSelectedId(null);
                    setEditor(null);
                  }}
                  onShare={() => {
                    void (async () => {
                      try {
                        const res = await fetch(t.url!);
                        const blob = await res.blob();
                        const file = new File([blob], "homs-proje.jpg", { type: blob.type || "image/jpeg" });
                        const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
                        if (nav.share) await nav.share({ files: [file], title: "Homs Proje" });
                        else await saveTurn(t);
                      } catch {
                        await saveTurn(t);
                      }
                    })();
                  }}
                />
                </>
              ) : t.role === "assistant" && t.kind === "video" && t.url ? (
                <div className="mt-2">
                  <Button size="sm" variant="outline" disabled={busy === "save"} onClick={() => void saveTurn(t)}>
                    <Download />
                    İndir
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
          {busy && busy !== "save" ? (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {busy === "video" ? progress || "Video…" : progress || "Görsel…"}
            </li>
          ) : null}
        </ol>
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit(text);
        }}
        className="shrink-0 overflow-x-hidden border-t border-border px-3 py-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void ingest(e.dataTransfer.files);
        }}
      >
        <div className="mx-auto max-w-2xl space-y-2">
          {videoPanel ? null : (
            <div className="flex flex-wrap items-center gap-1.5">
              <Link to="/app" className="grid size-7 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]" aria-label="Yeni">
                <Plus className="size-3.5" />
              </Link>
              <Link to="/arsiv" className="grid size-7 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]" aria-label="Sohbetler">
                <Folder className="size-3.5" />
              </Link>
              <Link
                to="/entegrasyon"
                className="inline-flex h-7 items-center gap-1 rounded-full bg-card px-2.5 text-[0.7rem] shadow-[var(--shadow-border)]"
              >
                <KeyRound className="size-3.5" />
                API
              </Link>
              <span className="text-[0.65rem] text-muted-foreground">Adet</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  title={`${n} ayrı alternatif`}
                  aria-label={`${n} alternatif görsel üret`}
                  onClick={() => {
                    setCount(n);
                    setShot(n === 1 ? "1" : "2c");
                  }}
                  className={`grid size-7 place-items-center rounded-full text-xs ${count === n ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpenFmt(openFmt === "aspect" ? null : "aspect")}
                className={`h-7 rounded-full px-3 text-[0.7rem] ${openFmt === "aspect" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              >
                Boyut {aspect}
              </button>
              <button
                type="button"
                onClick={() => setOpenFmt(openFmt === "quality" ? null : "quality")}
                className={`h-7 rounded-full px-3 text-[0.7rem] ${openFmt === "quality" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              >
                Netlik {resolution === "2k" ? "Net" : "Hızlı"}
              </button>
              <button
                type="button"
                onClick={() => setOpenFmt(openFmt === "gen" ? null : "gen")}
                className={`h-7 rounded-full px-3 text-[0.7rem] ${openFmt === "gen" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              >
                Üretim
              </button>
              {openFmt === "aspect"
                ? ASPECTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAspect(a);
                        setOpenFmt(null);
                      }}
                      className={`h-7 rounded-full px-2.5 text-[0.7rem] ${aspect === a ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
                    >
                      {a}
                    </button>
                  ))
                : null}
              {openFmt === "quality" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setResolution("1k");
                      setOpenFmt(null);
                    }}
                    className={`h-7 rounded-full px-2.5 text-[0.7rem] ${resolution === "1k" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
                  >
                    Hızlı · 1K
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResolution("2k");
                      setOpenFmt(null);
                    }}
                    className={`h-7 rounded-full px-2.5 text-[0.7rem] ${resolution === "2k" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
                  >
                    Net · 2K
                  </button>
                </>
              ) : null}
              {openFmt === "gen" ? (
                <div className="flex max-h-28 w-full flex-wrap gap-1.5 overflow-y-auto">
                  {GEN_ROOM.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setGenRoom(r.id)}
                      className={`h-7 rounded-full px-2.5 text-[0.7rem] ${genRoom === r.id ? "bg-foreground text-background" : "bg-muted"}`}
                    >
                      {r.label}
                    </button>
                  ))}
                  {GEN_LIGHT.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setGenLight(r.id)}
                      className={`h-7 rounded-full px-2.5 text-[0.7rem] ${genLight === r.id ? "bg-foreground text-background" : "bg-muted"}`}
                    >
                      {r.label}
                    </button>
                  ))}
                  {GEN_LENS.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setGenLens(r.id)}
                      className={`h-7 rounded-full px-2.5 text-[0.7rem] ${genLens === r.id ? "bg-foreground text-background" : "bg-muted"}`}
                    >
                      {r.label}
                    </button>
                  ))}
                  {GEN_LOOK.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setGenLook(r.id)}
                      className={`h-7 rounded-full px-2.5 text-[0.7rem] ${genLook === r.id ? "bg-foreground text-background" : "bg-muted"}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {videoPanel && (
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl bg-muted px-3 py-3">
              <p className="text-xs text-muted-foreground">Kamera</p>
              <div className="flex flex-wrap gap-1.5">
                {CAMERAS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCamera(c.id)}
                    className={`h-8 rounded-full px-2.5 text-xs ${camera === c.id ? "bg-foreground text-background" : "bg-card"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Hareket (fırça)</p>
              <div className="flex flex-wrap gap-1.5">
                {ZONES.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() =>
                      setZones((cur) => (cur.includes(z.id) ? cur.filter((id) => id !== z.id) : [...cur, z.id]))
                    }
                    className={`h-8 rounded-full px-2.5 text-xs ${zones.includes(z.id) ? "bg-foreground text-background" : "bg-card"}`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["low", "mid"] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIntensity(n)}
                    className={`h-8 rounded-full px-2.5 text-xs ${intensity === n ? "bg-foreground text-background" : "bg-card"}`}
                  >
                    {n === "low" ? "Düşük şiddet" : "Orta"}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ASPECTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAspect(a)}
                    className={`h-8 rounded-full px-2.5 text-xs ${aspect === a ? "bg-foreground text-background" : "bg-card"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.sec}
                    type="button"
                    onClick={() => setDuration(d.sec)}
                    className={`h-8 rounded-full px-2.5 text-xs ${duration === d.sec ? "bg-foreground text-background" : "bg-card"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Ambiyans · Veo</p>
              <div className="flex flex-wrap gap-1.5">
                {AUDIO.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudio(a.id)}
                    className={`h-8 rounded-full px-2.5 text-xs ${audio === a.id ? "bg-foreground text-background" : "bg-card"}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setExtendShot((v) => !v)}
                  className={`h-8 rounded-full px-2.5 text-xs ${extendShot ? "bg-foreground text-background" : "bg-card"}`}
                >
                  Sahneyi uzat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const imgs = turns.filter((x) => x.kind === "image" && x.url && x.url !== videoFrom);
                    const next = imgs.at(-1)?.url ?? null;
                    setEndFrom((cur) => (cur ? null : next));
                  }}
                  className={`h-8 rounded-full px-2.5 text-xs ${endFrom ? "bg-foreground text-background" : "bg-card"}`}
                >
                  İlk → son kare
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void runVideo(
                      `${CAMERAS.find((c) => c.id === camera)?.label} · ${duration}sn`,
                      videoFrom ?? selected?.url,
                    )
                  }
                >
                  Üret
                </Button>
                <button type="button" className="text-xs text-muted-foreground" onClick={() => setVideoPanel(false)}>
                  Vazgeç
                </button>
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <ul className="flex gap-2 overflow-x-auto">
              {sources.map((s) => (
                <li key={s.id} className="relative shrink-0">
                  <img src={s.url} alt="" className="h-20 w-16 rounded-xl object-cover" />
                  <button
                    type="button"
                    className="absolute bottom-0 left-0 right-0 bg-foreground/80 py-0.5 text-center text-[0.55rem] text-background"
                    onClick={() =>
                      setSources((cur) =>
                        cur.map((x) =>
                          x.id === s.id ? { ...x, role: x.role === "room" ? "ref" : "room" } : x,
                        ),
                      )
                    }
                  >
                    {s.role === "ref" ? "Stil" : "Kamera"}
                  </button>
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-background"
                    onClick={() => setSources(sources.filter((x) => x.id !== s.id))}
                    aria-label="Kaldır"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]"
              onClick={() => fileRef.current?.click()}
              aria-label="Fotoğraf"
            >
              <ImagePlus className="size-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void ingest(e.target.files);
                e.target.value = "";
              }}
            />
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder=""
              className="!min-h-11 max-h-16 flex-1 resize-none text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(text);
                }
              }}
            />
            <button
              type="button"
              className={`grid size-11 shrink-0 place-items-center rounded-full ${listening ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              onClick={listenVoice}
              aria-label="Ses"
            >
              <Mic className="size-4" />
            </button>
            <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={Boolean(busy) || (!text.trim() && !sources.length && !picks.length)}>
              {busy && busy !== "save" ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
        </div>
      </form>
      {editor && selected?.url ? (
        <ImageEditOverlay
          url={selected.url}
          mode={editor}
          busy={Boolean(busy)}
          onClose={() => setEditor(null)}
          onPaint={(prompt) => {
            setPicks((c) => [...c, prompt]);
            setEditor(null);
          }}
          onComment={(notes) => {
            setPicks((c) => [...c, ...notes]);
            setEditor(null);
          }}
          onResize={(ar) => {
            setAspect(ar as (typeof ASPECTS)[number]);
            setPicks((c) => [...c, `Kadraj ${ar}`]);
            setEditor(null);
          }}
        />
      ) : null}
      {carousel ? <CarouselOverlay urls={carousel} onClose={() => setCarousel(null)} /> : null}
      {fullUrl ? (
        <div className="absolute inset-0 z-50 flex flex-col bg-background">
          {fullUrl.endsWith(".mp4") || fullUrl.includes("video") ? (
            <video src={fullUrl} controls autoPlay playsInline className="m-auto max-h-[70%] max-w-full" />
          ) : (
            <img src={fullUrl} alt="" className="m-auto max-h-[70%] max-w-full object-contain" />
          )}
          <button
            type="button"
            className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-foreground text-background"
            onClick={() => setFullUrl(null)}
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ImageTools(props: {
  turn: ChatTurn;
  phase: "edit" | "review" | "done";
  menu: CatalogId | null;
  picks: string[];
  hintShift: number;
  busy: boolean;
  saving: boolean;
  shot: "1" | "2c" | "2a";
  frame: "wide" | "mid" | "close";
  dlOpen: boolean;
  onMenu: (id: CatalogId) => void;
  onTogglePick: (h: string) => void;
  onApply: () => void;
  onAccept: () => void;
  onReject: () => void;
  onDownload: () => void;
  onVideo: () => void;
  onCarousel: () => void;
  onRevise: () => void;
  onShot: (s: "1" | "2c" | "2a") => void;
  onFrame: (f: "wide" | "mid" | "close") => void;
  onExpand: () => void;
  onDl: () => void;
  onDlSize: (a: "16:9" | "9:16" | "1:1" | "4:3" | "orig") => void;
}) {
  const group = CATALOG.find((d) => d.id === props.menu);
  const hints = group
    ? group.hints.map((_, i) => group.hints[(i + props.hintShift) % group.hints.length])
    : [];

  if (props.phase === "review" || props.phase === "done") {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" disabled={props.saving} onClick={props.onDl}>
            <Download />
            İndir
          </Button>
          <Button size="sm" variant="outline" disabled={props.busy} onClick={props.onVideo}>
            Video
          </Button>
          <Button size="sm" variant="outline" onClick={props.onCarousel}>
            Karusel
          </Button>
          <Button size="sm" variant="outline" onClick={props.onRevise}>
            Revize
          </Button>
          <Button size="sm" variant="outline" onClick={props.onExpand}>
            Büyüt
          </Button>
        </div>
        {props.dlOpen ? (
          <div className="flex flex-wrap gap-1.5">
            {(["orig", "9:16", "16:9", "1:1", "4:3"] as const).map((a) => (
              <button
                key={a}
                type="button"
                className="h-8 rounded-full bg-muted px-2.5 text-xs"
                onClick={() => props.onDlSize(a)}
              >
                {a === "orig" ? "Orijinal" : a}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {CATALOG.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => props.onMenu(d.id)}
            className={`h-7 rounded-full px-2.5 text-[0.7rem] ${props.menu === d.id ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
          >
            {d.label}
          </button>
        ))}
      </div>
      {hints.length ? (
        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
          {hints.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => props.onTogglePick(h)}
              className={`h-7 rounded-full px-2.5 text-[0.7rem] ${props.picks.includes(h) ? "bg-foreground text-background" : "bg-muted"}`}
            >
              {h}
            </button>
          ))}
        </div>
      ) : null}
      {props.picks.length ? <p className="text-[0.7rem] text-muted-foreground">{props.picks.length} seçim</p> : null}
      <button
        type="button"
        className="h-8 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
        disabled={props.busy}
        onClick={props.onApply}
      >
        Onayla
      </button>
    </div>
  );
}

