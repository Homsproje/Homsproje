import { useEffect, useState } from "react";
import { loadPins, type MapPin } from "@/lib/map-store";

const WEST = 28.82;
const EAST = 29.18;
const SOUTH = 40.96;
const NORTH = 41.24;

function pos(lat: number, lng: number) {
  return {
    left: `${((lng - WEST) / (EAST - WEST)) * 100}%`,
    top: `${((NORTH - lat) / (NORTH - SOUTH)) * 100}%`,
  };
}

export function IstanbulMap({
  pins,
  onPick,
}: {
  pins?: MapPin[];
  onPick?: (pin: MapPin) => void;
}) {
  const [marks, setMarks] = useState<MapPin[]>(pins ?? []);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    setMarks(pins ?? loadPins());
  }, [pins]);
  const current = marks.find((p) => p.id === active);

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-border)]">
      <div className="relative aspect-[16/11] w-full bg-[#e8efe4]">
        <iframe
          title="İstanbul haritası"
          className="absolute inset-0 h-full w-full border-0 grayscale-[0.15]"
          src="https://www.openstreetmap.org/export/embed.html?bbox=28.82%2C40.96%2C29.18%2C41.24&layer=mapnik"
        />
        <div className="pointer-events-none absolute inset-0">
          {marks.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
              style={pos(p.lat, p.lng)}
              onClick={() => {
                setActive(p.id);
                onPick?.(p);
              }}
              aria-label={p.title}
            >
              <span className="block h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/25" />
              <span className="mt-1 block whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[0.65rem] text-background">
                {p.title}
              </span>
            </button>
          ))}
        </div>
      </div>
      {current ? (
        <p className="px-4 py-3 text-sm">
          {current.title}
          <span className="text-muted-foreground"> · {current.lat.toFixed(4)}, {current.lng.toFixed(4)}</span>
        </p>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground">Pin’e dokunun — konum proje bazında güncellenir.</p>
      )}
    </div>
  );
}
