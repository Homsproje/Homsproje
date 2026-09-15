import { useState } from "react";

export function ClipPlayer({ clips, poster }: { clips: string[]; poster?: string }) {
  const [i, setI] = useState(0);
  const src = clips[i] ?? clips[0];
  if (!src) return null;
  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-muted shadow-[var(--shadow-border)]">
      <video
        key={src}
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        className="mx-auto max-h-[38vh] w-auto max-w-full bg-black object-contain"
        onEnded={() => setI((n) => (n + 1) % clips.length)}
      />
      {clips.length > 1 && (
        <p className="px-4 py-2 text-xs text-muted-foreground">
          Sahne {i + 1} / {clips.length}
        </p>
      )}
    </div>
  );
}
