import type { HomsAiIntent, HomsAiInterpretRequest } from "./types";

export function heuristicIntent(req: HomsAiInterpretRequest): Omit<HomsAiIntent, "ok"> {
  const t = req.text.toLocaleLowerCase("tr-TR");
  const explicitVideo = /\bvideoya\b|\bvideo\s*tur\b|\bwalkthrough\b|\bvideo\s*yap\b|\bvideosu\b/.test(t);
  const wantsPhoto = /\bfotoğraf\b|\bfotograf\b|\bgörsel\b|\biki ayrı\b/.test(t);
  const action: HomsAiIntent["action"] = explicitVideo && !wantsPhoto ? "video" : "image";
  let count = 1;
  if (/iki ayrı|2 ayrı|iki fotoğraf|iki fotograf|iki açı|iki aci/.test(t)) count = 2;
  else if (/üç ayrı|uc ayrı|3 ayrı|üç fotoğraf/.test(t)) count = 3;
  else if (/dört ayrı|4 ayrı/.test(t)) count = 4;
  count = Math.min(count, Math.max(1, req.photoCount || count));
  return {
    action,
    count,
    preserveCamera: /koru|orijinal|orjinal|açı.*sabit|aci.*sabit|boş hal|bos hal/.test(t),
    inspiredNotCopy: !/birebir aynı|aynısını kopyala|tıpatıp/.test(t),
    notes: req.text.slice(0, 800),
  };
}

export function parseIntentJson(raw: string): Omit<HomsAiIntent, "ok"> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const j = JSON.parse(raw.slice(start, end + 1)) as Partial<Omit<HomsAiIntent, "ok">>;
    const action = j.action === "video" || j.action === "edit" || j.action === "image" ? j.action : "image";
    const count = Math.min(6, Math.max(1, Number(j.count) || 1));
    return {
      action,
      count,
      preserveCamera: Boolean(j.preserveCamera),
      inspiredNotCopy: j.inspiredNotCopy !== false,
      notes: typeof j.notes === "string" ? j.notes : "",
    };
  } catch {
    return null;
  }
}
