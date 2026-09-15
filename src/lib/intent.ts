export function wantsVideo(text: string) {
  const t = text.toLocaleLowerCase("tr-TR");
  if (/\bfotoğraf\b|\bfotograf\b|\bgörsel\b|\biki ayrı\b/.test(t) && !/videoya/.test(t)) return false;
  return /\bvideoya\b|\bvideo\s*tur\b|\bwalkthrough\b|\bvideo\s*yap\b|\bvideosu\b/.test(t);
}

export function isRevise(text: string) {
  const t = text.toLocaleLowerCase("tr-TR");
  return /beğenmedim|degistir|değiştir|düzelt|revize|bunu|bu kare|bu görsel|ışık|aydinlat|aydınlat|daha sade|daha elegant|yerinde kalsın|entegr/.test(
    t,
  );
}

export function requestedCount(text: string) {
  const t = text.toLocaleLowerCase("tr-TR");
  if (/iki ayrı|2 ayrı|iki fotoğraf|iki fotograf|iki açı|iki aci|hem mutfağa|hem.*cama/.test(t)) return 2;
  if (/üç ayrı|uc ayrı|3 ayrı|üç fotoğraf/.test(t)) return 3;
  if (/dört ayrı|4 ayrı/.test(t)) return 4;
  return 1;
}

export function buildRoomPrompt(opts: {
  text: string;
  notes?: string;
  preserveCamera: boolean;
  inspiredNotCopy: boolean;
  index: number;
  total: number;
  hasRefs: boolean;
  revise?: boolean;
}) {
  return [
    `User command: ${opts.text}`,
    opts.notes ? `Notes: ${opts.notes}` : "",
    opts.revise
      ? "Edit THIS image in place. Keep the same camera, walls, windows, and architecture. Change only what the user asked. Do not start from a blank room. Do not merge other photos’ rooms."
      : `This call is still ${opts.index + 1} of ${opts.total}. One photograph only.`,
    !opts.revise &&
      "The FIRST image is the empty room CAMERA. Keep this exact viewpoint, walls, windows, floor, ceiling, and openings. Do not reframe. Do not invent a balcony. Do not merge kitchen and living from other photos.",
    opts.hasRefs
      ? "Later images are STYLE BIBLES only: furniture quality, wood tones, LED cove lighting, color palette, luxury materials. Do not copy their architecture. Do not paste those rooms in. Do NOT output a generic gray sofa or a cheap coffee table. Invent original high-end pieces in the same collection language as the references — sculptural seating, warm LEDs, refined kitchen lighting."
      : "Design original high-end modern furniture that fits this architecture. Avoid generic catalog sofas.",
    "Photoreal interior, no people, no text, no logos, no watermarks.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function scoreEmpty(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 48;
      c.height = 48;
      const ctx = c.getContext("2d");
      if (!ctx) {
        resolve(0.5);
        return;
      }
      ctx.drawImage(img, 0, 0, 48, 48);
      const d = ctx.getImageData(0, 0, 48, 48).data;
      let acc = 0;
      let n = 0;
      for (let y = 20; y < 48; y++) {
        for (let x = 0; x < 48; x++) {
          const i = (y * 48 + x) * 4;
          const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
          acc += Math.abs(l - 180);
          n++;
        }
      }
      const meanDev = acc / n;
      resolve(Math.max(0, Math.min(1, 1 - meanDev / 90)));
    };
    img.onerror = () => resolve(0.5);
    img.src = url;
  });
}
