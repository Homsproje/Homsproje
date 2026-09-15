export const CAMERAS = [
  {
    id: "dolly",
    label: "Dolly içeri",
    prompt:
      "The camera slowly dollies forward through the room, steady gimbal, locked horizon, architecture stays solid. Crisp motion.",
  },
  {
    id: "pull",
    label: "Geri çekil",
    prompt:
      "The camera slowly pulls back revealing more of the room, locked horizon, architecture stays solid. Crisp motion.",
  },
  {
    id: "zoom",
    label: "Yakınlaş",
    prompt: "Slow optical zoom toward the seating, locked horizon, no morphing. Architecture stays solid.",
  },
  {
    id: "pan",
    label: "Yavaş pan",
    prompt: "Slow pan across the seating, locked horizon, architecture stays solid. Crisp motion.",
  },
  {
    id: "orbit",
    label: "Yörünge",
    prompt: "Gentle orbit around the living area, gimbal-stable, architecture stays solid. No people.",
  },
  {
    id: "gimbal",
    label: "Gimbal tur",
    prompt:
      "First-person gimbal walk through the apartment, eye-level, slow, locked horizon, architecture stays solid.",
  },
  {
    id: "window",
    label: "Pencereden",
    prompt:
      "Slow dolly from the window into the room, locked horizon, warm light steady. Architecture stays solid.",
  },
  {
    id: "crane",
    label: "Vinç",
    prompt: "Slow crane from low to eye-level inside the room, locked architecture. Crisp motion.",
  },
  {
    id: "locked",
    label: "Sabit",
    prompt: "Locked-off camera. Architecture stays solid. Minimal subject motion only. Crisp motion.",
  },
  {
    id: "facade",
    label: "Cephe",
    prompt:
      "Slow crane up the facade at golden hour, windows glowing, architecture stays solid. Crisp motion.",
  },
] as const;

export const ZONES = [
  { id: "curtains", label: "Tül / perde", prompt: "Sheer curtains drift gently in a light breeze." },
  { id: "plants", label: "Bitki", prompt: "Plant leaves tremble slightly." },
  { id: "city", label: "Dış ışık", prompt: "City lights flicker softly outside the window." },
  { id: "water", label: "Su", prompt: "Water surface ripples gently." },
] as const;

export const AUDIO = [
  { id: "mute", label: "Sessiz", prompt: "Silent clip. No dialogue, no music, no people." },
  { id: "room", label: "Salon ambiyans", prompt: "Soft interior room tone and distant city, no speech, no lyrics." },
  { id: "street", label: "Dış ses", prompt: "Quiet street ambience through open windows, no speech." },
] as const;

export type CameraId = (typeof CAMERAS)[number]["id"];
export type ZoneId = (typeof ZONES)[number]["id"];
export type AudioId = (typeof AUDIO)[number]["id"];

export function buildDirectorPrompt(opts: {
  camera: CameraId;
  zones: ZoneId[];
  intensity: "low" | "mid";
  audio?: AudioId;
  brief?: string;
  extend?: boolean;
  endHint?: string;
}) {
  const cam = CAMERAS.find((c) => c.id === opts.camera) ?? CAMERAS[0];
  const zoneText = ZONES.filter((z) => opts.zones.includes(z.id))
    .map((z) => z.prompt)
    .join(" ");
  const intensity =
    opts.intensity === "low"
      ? "Very slow, listing-tour energy, real physics, no morphing furniture, no people, no text."
      : "Slow and steady listing tour, furniture stays solid, no people, no text.";
  const audio = AUDIO.find((a) => a.id === (opts.audio ?? "mute"))?.prompt;
  const extend = opts.extend
    ? "Continue the SAME camera move from the end of the previous shot. Do not restart. Keep lighting and architecture."
    : "";
  const end = opts.endHint
    ? `The last frame should feel like arriving at this composition: ${opts.endHint}. Smooth interpolation, no jump cut.`
    : "";
  return [cam.prompt, zoneText, intensity, audio, extend, end, opts.brief?.trim()]
    .filter(Boolean)
    .join(" ");
}
