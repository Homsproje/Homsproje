import { REGIONS, type RegionId } from "@/lib/site";

export type MapPin = {
  id: string;
  region: RegionId;
  title: string;
  lat: number;
  lng: number;
};

const KEY = "homs-pins-v1";

export const DEFAULT_PINS: MapPin[] = [
  { id: "besiktas", region: "besiktas", title: "Beşiktaş", lat: 41.043, lng: 29.007 },
  { id: "etiler", region: "etiler", title: "Etiler", lat: 41.082, lng: 29.034 },
  { id: "vadistanbul", region: "vadistanbul", title: "Vadistanbul", lat: 41.108, lng: 28.988 },
  { id: "gokturk", region: "gokturk", title: "Göktürk", lat: 41.181, lng: 28.887 },
  { id: "kemerburgaz", region: "kemerburgaz", title: "Kemerburgaz", lat: 41.17, lng: 28.91 },
];

export function loadPins(): MapPin[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PINS;
    const extra = JSON.parse(raw) as MapPin[];
    const ids = new Set(extra.map((p) => p.id));
    return [...extra, ...DEFAULT_PINS.filter((p) => !ids.has(p.id))];
  } catch {
    return DEFAULT_PINS;
  }
}

export function savePins(pins: MapPin[]) {
  localStorage.setItem(KEY, JSON.stringify(pins));
}

export function regionName(id: RegionId) {
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}
