import { useState } from "react";

export function Compare({
  before,
  after,
  beforeLabel = "Önce",
  afterLabel = "Sonra",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [pos, setPos] = useState(52);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-muted shadow-[var(--shadow-border)]">
      <img src={after} alt={afterLabel} className="block aspect-video w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img src={before} alt={beforeLabel} className="h-full w-full object-cover" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-background"
        style={{ left: `${pos}%` }}
      />
      <div
        className="pointer-events-none absolute top-1/2 z-10 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-[var(--shadow-border)]"
        style={{ left: `${pos}%` }}
        aria-hidden
      />
      <input
        type="range"
        min={4}
        max={96}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Karşılaştır"
        className="absolute inset-0 z-20 cursor-ew-resize opacity-0"
      />
      <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-kicker uppercase tracking-kicker text-foreground">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-foreground/90 px-2.5 py-1 text-kicker uppercase tracking-kicker text-background">
        {afterLabel}
      </span>
    </div>
  );
}
