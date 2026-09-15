import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBrandedImage, fileBase } from "@/lib/export";
import { toast } from "sonner";

export function CarouselOverlay(props: {
  urls: string[];
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const url = props.urls[i];

  async function saveAll() {
    toast("Karusel indiriliyor…");
    for (let n = 0; n < props.urls.length; n++) {
      await downloadBrandedImage(props.urls[n], `${fileBase("image", `homs-karusel-${n + 1}`)}.jpg`);
    }
    toast("Slaytlar hazır");
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <button type="button" className="grid size-9 place-items-center rounded-full bg-card" onClick={props.onClose} aria-label="Kapat">
          <X className="size-4" />
        </button>
        <p className="text-sm">
          Karusel {i + 1}/{props.urls.length}
        </p>
        <Button size="sm" variant="outline" onClick={() => void saveAll()}>
          <Download />
          Tümü
        </Button>
      </div>
      <button
        type="button"
        className="relative min-h-0 flex-1"
        onClick={(e) => {
          const mid = e.currentTarget.clientWidth / 2;
          setI((n) => (e.clientX > mid ? Math.min(props.urls.length - 1, n + 1) : Math.max(0, n - 1)));
        }}
      >
        {url ? <img src={url} alt="" className="mx-auto max-h-full max-w-full object-contain" /> : null}
      </button>
      <div className="flex shrink-0 justify-center gap-1.5 py-3">
        {props.urls.map((_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => setI(n)}
            className={`h-1.5 rounded-full ${n === i ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/40"}`}
            aria-label={`Slayt ${n + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
