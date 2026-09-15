export const ASPECTS = [
  { id: "16:9", label: "16:9 yatay", hint: "İlan, YouTube" },
  { id: "9:16", label: "9:16 dikey", hint: "Reels, Story" },
  { id: "1:1", label: "1:1 kare", hint: "Feed" },
  { id: "4:3", label: "4:3", hint: "Plan, maket" },
  { id: "3:2", label: "3:2", hint: "Fotoğraf" },
  { id: "21:9", label: "21:9", hint: "Sinema" },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export const RESOLUTIONS = [
  { id: "1k", label: "1K", hint: "Hızlı" },
  { id: "2k", label: "2K", hint: "Net" },
] as const;

export type ResolutionId = (typeof RESOLUTIONS)[number]["id"];

export const FILE_FORMATS = [
  { id: "jpeg", label: "JPEG" },
  { id: "png", label: "PNG" },
] as const;

export type FileFormatId = (typeof FILE_FORMATS)[number]["id"];

export const VIDEO_LENGTHS = [
  { id: 15, label: "15 sn", hint: "AI hareket" },
  { id: 30, label: "30 sn", hint: "Tur" },
  { id: 60, label: "1 dk", hint: "Tur" },
  { id: 90, label: "1,5 dk", hint: "Tur" },
  { id: 120, label: "2 dk", hint: "Tur" },
  { id: 180, label: "3 dk", hint: "Tur" },
] as const;

export const PIXEL: Record<AspectId, { w: number; h: number }> = {
  "16:9": { w: 1280, h: 720 },
  "9:16": { w: 720, h: 1280 },
  "1:1": { w: 1080, h: 1080 },
  "4:3": { w: 1200, h: 900 },
  "3:2": { w: 1200, h: 800 },
  "21:9": { w: 1680, h: 720 },
};

export const MAX_SOURCES = 15;
export const API_IMAGE_LIMIT = 3;
