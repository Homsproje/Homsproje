import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, fileToDataUrl, uid } from "@/lib/utils";
import type { SourceImage } from "@/store/studio";

export function Dropzone({
  sources,
  onChange,
  hint,
  max = 20,
}: {
  sources: SourceImage[];
  onChange: (next: SourceImage[]) => void;
  hint: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function ingest(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setBusy(true);
    try {
      const room = max - sources.length;
      const batch = list.slice(0, room);
      const added = await Promise.all(
        batch.map(async (file) => ({
          id: uid(),
          url: await fileToDataUrl(file),
          name: file.name,
        })),
      );
      onChange([...sources, ...added]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void ingest(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-card px-4 py-8 text-center shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-[var(--motion-quick)]",
          drag && "bg-muted",
          sources.length >= max && "opacity-50",
        )}
        disabled={sources.length >= max || busy}
      >
        <ImagePlus className="size-5 text-muted-foreground" strokeWidth={1.5} />
        <p className="max-w-xs text-pretty text-sm text-muted-foreground">{hint}</p>
        <span className="text-[0.7rem] uppercase tracking-[0.16em] text-subtle">
          {busy ? "Okunuyor…" : `${sources.length}/${max}`}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void ingest(e.target.files);
            e.target.value = "";
          }}
        />
      </button>
      {sources.length > 0 && (
        <ul className="grid grid-cols-5 gap-2">
          {sources.map((s) => (
            <li key={s.id} className="relative overflow-hidden rounded-xl bg-muted">
              <img src={s.url} alt={s.name} className="aspect-[4/3] w-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="inverse"
                className="absolute right-1.5 top-1.5 size-8"
                onClick={() => onChange(sources.filter((x) => x.id !== s.id))}
                aria-label="Kaldır"
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
