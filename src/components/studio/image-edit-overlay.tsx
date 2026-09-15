import { useEffect, useRef, useState, type PointerEvent as PE, type MouseEvent as ME } from "react";
import { Eraser, Maximize2, MessageSquarePlus, PenLine, Redo2, Share, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RESIZE = [
  { id: "16:9", label: "Geniş ekran", sub: "16:9" },
  { id: "4:3", label: "Manzara", sub: "4:3" },
  { id: "9:16", label: "Hikâye", sub: "9:16" },
  { id: "3:4", label: "Porte", sub: "3:4" },
  { id: "1:1", label: "Kare", sub: "1:1" },
] as const;

type Pin = { id: number; x: number; y: number; text: string };
type Tool = "brush" | "eraser";

function regionFromMask(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "ortadaki bölge";
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let sx = 0,
    sy = 0,
    n = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 20) continue;
    const p = (i - 3) / 4;
    sx += p % width;
    sy += Math.floor(p / width);
    n++;
  }
  if (!n) return "işaretli bölge";
  const fx = sx / n / width;
  const fy = sy / n / height;
  const h = fx < 0.33 ? "sol" : fx > 0.66 ? "sağ" : "orta";
  const v = fy < 0.33 ? "üst" : fy > 0.66 ? "alt" : "orta";
  return `${v} ${h} bölge`;
}

export function ChatActions(props: {
  onEdit: () => void;
  onComment: () => void;
  onResize: () => void;
  onRemove: () => void;
  onShare?: () => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-1">
      <button type="button" className="flex flex-col items-center gap-1 py-1 text-[0.65rem] text-muted-foreground" onClick={props.onEdit}>
        <span className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]">
          <PenLine className="size-4" />
        </span>
        Düzenle
      </button>
      <button type="button" className="flex flex-col items-center gap-1 py-1 text-[0.65rem] text-muted-foreground" onClick={props.onComment}>
        <span className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]">
          <MessageSquarePlus className="size-4" />
        </span>
        Yorum
      </button>
      <button type="button" className="flex flex-col items-center gap-1 py-1 text-[0.65rem] text-muted-foreground" onClick={props.onResize}>
        <span className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]">
          <Maximize2 className="size-4" />
        </span>
        Boyut
      </button>
      <button type="button" className="flex flex-col items-center gap-1 py-1 text-[0.65rem] text-muted-foreground" onClick={props.onRemove}>
        <span className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]">
          <Trash2 className="size-4" />
        </span>
        Kaldır
      </button>
      {props.onShare ? (
        <button type="button" className="col-span-4 flex items-center justify-center gap-2 text-[0.7rem] text-muted-foreground" onClick={props.onShare}>
          <Share className="size-3.5" /> Paylaş
        </button>
      ) : null}
    </div>
  );
}

export function ImageEditOverlay(props: {
  url: string;
  mode: "paint" | "comment" | "resize";
  busy?: boolean;
  onClose: () => void;
  onPaint: (prompt: string) => void;
  onComment: (notes: string[]) => void;
  onResize: (aspect: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const history = useRef<ImageData[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [note, setNote] = useState("");
  const [painted, setPainted] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [size, setSize] = useState(18);

  useEffect(() => {
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const sync = () => {
      c.width = img.clientWidth;
      c.height = img.clientHeight;
      history.current = [];
      setPainted(false);
    };
    if (img.complete) sync();
    img.onload = sync;
  }, [props.url, props.mode]);

  function ctx() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function snapshot() {
    const c = canvasRef.current;
    const g = ctx();
    if (!c || !g) return;
    history.current.push(g.getImageData(0, 0, c.width, c.height));
    if (history.current.length > 16) history.current.shift();
  }

  function pos(e: PE<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function paintAt(e: PE<HTMLCanvasElement>) {
    const g = ctx();
    if (!g) return;
    const { x, y } = pos(e);
    g.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    g.fillStyle = "rgba(80,140,255,0.45)";
    g.beginPath();
    g.arc(x, y, size, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = "source-over";
    setPainted(true);
  }

  function undo() {
    const c = canvasRef.current;
    const g = ctx();
    const last = history.current.pop();
    if (!c || !g || !last) {
      g?.clearRect(0, 0, c?.width ?? 0, c?.height ?? 0);
      setPainted(false);
      return;
    }
    g.putImageData(last, 0, 0);
  }

  function clearMask() {
    const c = canvasRef.current;
    const g = ctx();
    if (!c || !g) return;
    g.clearRect(0, 0, c.width, c.height);
    history.current = [];
    setPainted(false);
  }

  function addPin(e: ME<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, input")) return;
    const r = e.currentTarget.getBoundingClientRect();
    setPins((p) => [
      ...p,
      { id: p.length + 1, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, text: "" },
    ]);
  }

  function sendPaint(kind: "edit" | "remove" | "expand") {
    const region = canvasRef.current ? regionFromMask(canvasRef.current) : "işaretli bölge";
    if (kind === "remove") {
      props.onPaint(`Remove whatever is in the ${region}. Fill with the real surrounding room, floor and walls. Do not change camera, architecture or other furniture.`);
      return;
    }
    if (kind === "expand") {
      props.onPaint(`Outpaint and expand the canvas of this interior. Reveal more of the same room on all sides. Keep camera language, materials and furniture. No new rooms.`);
      return;
    }
    const extra = note.trim();
    props.onPaint(
      `Edit ONLY the ${region} (painted highlight). ${extra || "Improve that area to match the luxury interior."} Keep the rest of the room, camera, architecture and furniture identical.`,
    );
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <button type="button" className="grid size-9 place-items-center rounded-full bg-card" onClick={props.onClose} aria-label="Geri">
          <X className="size-4" />
        </button>
        <p className="text-sm">
          {props.mode === "paint" ? (painted ? "Alan seçildi" : "Fırça ile boyayın") : props.mode === "comment" ? `${pins.length} yorum` : "Boyutlandır"}
        </p>
        {props.mode === "resize" ? (
          <span className="w-9" />
        ) : (
          <Button
            size="sm"
            disabled={
              props.busy ||
              (props.mode === "paint" && !painted && !note.trim()) ||
              (props.mode === "comment" && pins.length === 0)
            }
            onClick={() => {
              if (props.mode === "paint") sendPaint("edit");
              else if (props.mode === "comment") {
                props.onComment(pins.map((p) => `Not ${p.id}: ${p.text.trim() || "(açıklama yok)"}`));
              }
            }}
          >
            {props.mode === "comment" ? "Ekle" : "Ekle"}
          </Button>
        )}
      </div>

      {props.mode === "resize" ? (
        <ul className="m-auto w-full max-w-sm space-y-1 px-4">
          {RESIZE.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl bg-card px-3 py-3 text-left text-sm shadow-[var(--shadow-border)]"
                onClick={() => props.onResize(r.id)}
              >
                <span className="grid size-8 place-items-center rounded border border-border text-[0.65rem]">{r.sub}</span>
                <span>
                  {r.label} <span className="text-muted-foreground">({r.sub})</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="relative mx-auto min-h-0 flex-1 px-3">
          <div className="relative mx-auto inline-block max-h-full max-w-full" onClick={props.mode === "comment" ? addPin : undefined}>
            <img ref={imgRef} src={props.url} alt="" className="max-h-[36vh] w-auto max-w-full rounded-2xl object-contain" />
            {props.mode === "paint" ? (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full touch-none rounded-2xl"
                onPointerDown={(e) => {
                  snapshot();
                  drawing.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  paintAt(e);
                }}
                onPointerMove={(e) => drawing.current && paintAt(e)}
                onPointerUp={() => {
                  drawing.current = false;
                }}
              />
            ) : null}
            {props.mode === "comment"
              ? pins.map((p) => (
                  <span
                    key={p.id}
                    className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-xs text-background"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    {p.id}
                  </span>
                ))
              : null}
          </div>
        </div>
      )}

      {props.mode === "paint" ? (
        <div className="shrink-0 space-y-2 px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTool("brush")}
              className={`grid size-9 place-items-center rounded-full ${tool === "brush" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              aria-label="Fırça"
            >
              <PenLine className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool("eraser")}
              className={`grid size-9 place-items-center rounded-full ${tool === "eraser" ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              aria-label="Silgi"
            >
              <Eraser className="size-4" />
            </button>
            {[10, 18, 32].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSize(n)}
                className={`h-8 rounded-full px-2.5 text-[0.7rem] ${size === n ? "bg-foreground text-background" : "bg-card shadow-[var(--shadow-border)]"}`}
              >
                {n === 10 ? "İnce" : n === 18 ? "Orta" : "Kalın"}
              </button>
            ))}
            <button type="button" className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]" onClick={undo} aria-label="Geri">
              <Undo2 className="size-4" />
            </button>
            <button type="button" className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]" onClick={clearMask} aria-label="Temizle">
              <Redo2 className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="h-8 rounded-full bg-muted px-3 text-[0.7rem]" disabled={props.busy || !painted} onClick={() => sendPaint("remove")}>
              Nesneyi sil
            </button>
            <button type="button" className="h-8 rounded-full bg-muted px-3 text-[0.7rem]" disabled={props.busy} onClick={() => sendPaint("expand")}>
              Tuvali genişlet
            </button>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bu alanda ne olsun?"
            className="h-11 w-full rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
          />
        </div>
      ) : null}

      {props.mode === "comment" ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
          {pins.length === 0 ? (
            <p className="text-xs text-muted-foreground">Fotoğrafa dokunun. Açıklamalar fotoğrafın altında kalır.</p>
          ) : (
            pins.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs text-background">{p.id}</span>
                <input
                  value={p.text}
                  onChange={(e) => setPins((cur) => cur.map((x) => (x.id === p.id ? { ...x, text: e.target.value } : x)))}
                  placeholder={`Not ${p.id}`}
                  className="h-11 min-w-0 flex-1 rounded-full bg-card px-4 text-base shadow-[var(--shadow-border)]"
                />
              </label>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
