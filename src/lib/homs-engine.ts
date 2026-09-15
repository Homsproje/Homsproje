import { CAMERAS, ZONES, type CameraId, type ZoneId } from "@/lib/director";

export type JobKind = "furnish" | "empty" | "revise" | "facade" | "garden" | "plan" | "video";

export type ParsedCommand = {
  kind: JobKind;
  count: number;
  aspect?: "16:9" | "4:3" | "1:1" | "9:16" | "3:4";
  camera?: CameraId;
  zones: ZoneId[];
  duration?: number;
  intensity?: "low" | "mid";
};

export function parseCommand(text: string): ParsedCommand {
  const t = text.toLocaleLowerCase("tr-TR");
  const kind: JobKind = /\bvideoya\b|\bvideo\s*yap\b|\bwalkthrough\b|\bgimbal\b|\bdolly\b/.test(t) &&
    !/\bfotoğraf\b|\bfotograf\b|\bgörsel\b/.test(t)
    ? "video"
    : /boşalt|mobilyalar[ıi] kald[ıi]r|e[sş]yas[ıi]z/.test(t)
      ? "empty"
      : /kat plan|kroki|izometrik|dollhouse|3d plan|üç boyutlu plan/.test(t)
        ? "plan"
        : /bahçe|teras|peyzaj|peyzaj/.test(t)
          ? "garden"
          : /cephe|bina d[ıi][sş]|d[ıi][sş] render|d[ıi][sş]ar[ıi]dan/.test(t)
            ? "facade"
            : /beğenmedim|değiştir|degistir|düzelt|revize|yalnızca|uygula|kadrajı/.test(t)
              ? "revise"
              : "furnish";

  let count = 1;
  if (kind !== "revise") {
    if (/iki ayrı|2 ayrı|iki fotoğraf|iki açı|hem mutfağa|hem.*cama/.test(t)) count = 2;
    if (/üç ayrı|3 ayrı|üç fotoğraf/.test(t)) count = 3;
    if (/dört ayrı|4 ayrı/.test(t)) count = 4;
  } else if (/2 konsept|iki konsept/.test(t)) count = 2;
  else if (/2 açı|iki açı/.test(t) && !/aynı açı/.test(t)) count = 2;

  let aspect: ParsedCommand["aspect"];
  if (/9:16|dikey|reels|story|hikâye|hikaye/.test(t)) aspect = "9:16";
  else if (/3:4|porte/.test(t)) aspect = "3:4";
  else if (/1:1|kare format/.test(t)) aspect = "1:1";
  else if (/4:3|manzara/.test(t)) aspect = "4:3";
  else if (/16:9|yatay|geniş ekran|genis ekran/.test(t)) aspect = "16:9";

  let camera: CameraId | undefined;
  if (/sabit|kilit|cinemagraph/.test(t)) camera = "locked";
  else if (/pencere/.test(t)) camera = "window";
  else if (/\bpan\b|yavaş pan/.test(t)) camera = "pan";
  else if (/cephe|dışarı|disari/.test(t)) camera = "facade";
  else if (/gimbal|tur/.test(t)) camera = "gimbal";
  else if (/dolly|ileri/.test(t)) camera = "dolly";
  else if (/orbit|yörünge|yorunge/.test(t)) camera = "orbit";
  else if (/çekil|geri|pull/.test(t)) camera = "pull";

  const zones: ZoneId[] = [];
  if (/tül|perde/.test(t)) zones.push("curtains");
  if (/bitki|yaprak/.test(t)) zones.push("plants");
  if (/şehir|dis isik|dış ışık|gece/.test(t)) zones.push("city");
  if (/su|havuz/.test(t)) zones.push("water");

  let duration: number | undefined;
  const min = t.match(/(\d+)\s*dakika/);
  const sec = t.match(/(\d+)\s*sn|\b(\d+)\s*saniye/);
  if (min) duration = Math.min(120, Number(min[1]) * 60);
  else if (sec) duration = Math.min(120, Number(sec[1] || sec[2]));
  else if (/1:30|1\.30/.test(t)) duration = 90;
  else if (/\b2\s*dk\b|\b2\s*dakika/.test(t)) duration = 120;

  const intensity: ParsedCommand["intensity"] = /orta|biraz daha/.test(t) ? "mid" : "low";

  return { kind, count, aspect, camera, zones, duration, intensity };
}

const LOCK =
  "Keep this exact camera, walls, windows, floor, ceiling, openings and room proportions. Do not reframe. Do not invent a balcony, extra room, or arch that is not in the camera photo.";
const LAYOUT =
  "ONE dining set only, placed next to the kitchen — never a second dining table by the window. Living seating faces the window. Do not duplicate furniture. Do not merge two rooms into one. Do NOT invent extra kitchen volume, fridge alcove, pantry, corridor or balcony. The refrigerator must sit inside the EXISTING kitchen run only.";
const FORBID =
  "Do not merge kitchen and living from other photos. No people, no text, no logos, no watermarks. Do not output a generic gray sofa or a cheap catalog coffee table.";
const STYLE =
  "Later images are STYLE BIBLES only: furniture silhouettes, wood tones, LED coves, color palette, luxury materials. Do not copy their architecture. Invent original high-end pieces in the same collection language — sculptural seating, warm LEDs, refined kitchen lighting.";

export function buildImagePrompt(opts: {
  kind: JobKind;
  text: string;
  index: number;
  total: number;
  hasRefs: boolean;
}) {
  const head = `User command: ${opts.text}`;
  const still = `This is still ${opts.index + 1} of ${opts.total}. One photograph only.`;

  if (opts.kind === "empty") {
    return [head, still, "Remove all furniture, rugs and styling objects.", LOCK, "Keep daylight and architecture. Empty listing photo.", FORBID].join(" ");
  }
  if (opts.kind === "facade") {
    return [
      head,
      still,
      "Photoreal architectural exterior render of this building. Golden-hour or clean daylight as requested. Accurate massing, windows and materials.",
      "Do not invent extra floors. No people, no text.",
    ].join(" ");
  }
  if (opts.kind === "garden") {
    return [
      head,
      still,
      "Design the garden, terrace or landscape around this property. Photoreal, planted, dusk or daylight as requested.",
      "Keep the building mass if visible. No people, no text.",
    ].join(" ");
  }
  if (opts.kind === "plan") {
    return [
      head,
      still,
      "Convert this floor plan or sketch into a photoreal 3D interior or isometric dollhouse matching the drawing exactly. Correct room counts and openings.",
      "No people, no text overlays.",
    ].join(" ");
  }
  if (opts.kind === "revise") {
    return [
      head,
      "Edit THIS image in place. Apply ALL requested changes in one photograph.",
      "Keep the SAME wide camera framing of the full room — do not crop to a ceiling, lamp, or furniture detail.",
      "If the user asks only for lighting, color, material or a single object: change that and nothing else.",
      LOCK,
      LAYOUT,
      "Do not start from a blank room. Do not restyle the whole apartment unless asked.",
      FORBID,
    ].join(" ");
  }
  return [
    head,
    still,
    "Furnish the empty room CAMERA (first image).",
    LOCK,
    LAYOUT,
    opts.hasRefs ? STYLE : "Design original high-end modern furniture that fits this architecture.",
    FORBID,
    "Photoreal interior listing photograph.",
  ].join(" ");
}

export { CAMERAS, ZONES };
