import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const IMAGE_MODEL = "grok-imagine-image-2.0";
const VIDEO_MODEL = "grok-imagine-video-1.5";

type ImageRef = { type: "image_url"; url: string };

function apiKey() {
  return process.env.XAI_API_KEY ?? "";
}

async function readXaiError(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string; code?: string } | string;
      message?: string;
    };
    if (typeof json.error === "string") return json.error;
    if (json.error && typeof json.error === "object" && json.error.message) return json.error.message;
    if (typeof json.message === "string") return json.message;
  } catch {
    /* ignore */
  }
  return text.slice(0, 280) || `xAI API ${res.status}`;
}

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) return url;
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (buf.byteLength > 2_400_000) return url;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const generateInput = z.object({
  prompt: z.string().min(8).max(4000),
  images: z.array(z.string().min(8)).max(3),
  aspectRatio: z.string().default("16:9"),
  resolution: z.enum(["1k", "2k"]).default("1k"),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => generateInput.parse(input))
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "AI bu ortamda kapalı." };

    const images: ImageRef[] = data.images.map((url) => ({ type: "image_url" as const, url }));
    const hasSource = images.length > 0;
    const endpoint = hasSource
      ? "https://api.x.ai/v1/images/edits"
      : "https://api.x.ai/v1/images/generations";

    const body: Record<string, unknown> = {
      model: IMAGE_MODEL,
      prompt: data.prompt,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution,
      quality: "auto",
      n: 1,
    };
    if (hasSource) {
      if (images.length === 1) body.image = images[0];
      else body.images = images;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false as const, error: await readXaiError(res) };
    }

    const json = (await res.json()) as {
      data?: { url?: string; b64_json?: string }[];
    };
    const first = json.data?.[0];
    let url = first?.url ?? "";
    if (!url && first?.b64_json) url = `data:image/jpeg;base64,${first.b64_json}`;
    if (!url) return { ok: false as const, error: "Görsel üretilemedi." };

    const persisted = await urlToDataUrl(url);
    return { ok: true as const, url: persisted };
  });

const videoStartInput = z.object({
  prompt: z.string().min(8).max(2000),
  image: z.string().min(8),
  duration: z.number().min(6).max(15).default(10),
  aspectRatio: z.string().default("16:9"),
});

export const startStudioVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => videoStartInput.parse(input))
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "AI bu ortamda kapalı." };

    const res = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: VIDEO_MODEL,
        prompt: data.prompt,
        duration: data.duration,
        aspect_ratio: data.aspectRatio,
        resolution: "720p",
        image: { url: data.image, type: "image_url" },
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: await readXaiError(res) };
    }

    const json = (await res.json()) as { request_id?: string; id?: string };
    const requestId = json.request_id ?? json.id;
    if (!requestId) return { ok: false as const, error: "Video isteği başlamadı." };
    return { ok: true as const, requestId };
  });

export const pollStudioVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ requestId: z.string().min(4) }).parse(input))
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "AI bu ortamda kapalı." };

    const res = await fetch(`https://api.x.ai/v1/videos/${data.requestId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      return { ok: false as const, error: await readXaiError(res) };
    }
    const json = (await res.json()) as {
      status?: string;
      video?: { url?: string };
      url?: string;
      error?: string;
    };
    const status = json.status ?? "pending";
    if (status === "failed" || status === "expired") {
      return { ok: false as const, error: json.error || "Video üretimi başarısız." };
    }
    if (status === "done" || status === "completed") {
      const url = json.video?.url ?? json.url;
      if (!url) return { ok: false as const, error: "Video adresi yok." };
      return { ok: true as const, status: "done" as const, url };
    }
    return { ok: true as const, status: "pending" as const };
  });

export const checkAiAvailable = createServerFn({ method: "GET" }).handler(async () => {
  return { ok: Boolean(apiKey()) };
});

export const fetchMedia = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ url: z.string().min(8) }).parse(input))
  .handler(async ({ data }) => {
    if (data.url.startsWith("data:")) {
      const m = data.url.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return { ok: false as const, error: "Dosya okunamadı." };
      return { ok: true as const, mime: m[1], b64: m[2] };
    }
    const res = await fetch(data.url);
    if (!res.ok) return { ok: false as const, error: "Dosya alınamadı." };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 24_000_000) return { ok: false as const, error: "Dosya çok büyük." };
    const mime = res.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
    return { ok: true as const, mime, b64: buf.toString("base64") };
  });

const interpretInput = z.object({
  text: z.string().min(1).max(4000),
  photoCount: z.number().min(0).max(20),
  hasSelected: z.boolean().optional(),
});

export const interpretCommand = createServerFn({ method: "POST" })
  .validator((input: unknown) => interpretInput.parse(input))
  .handler(async ({ data }) => {
    const key = apiKey();
    const fallback = heuristicIntent(data.text, data.photoCount);
    if (!key) return { ok: true as const, ...fallback };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You parse Turkish real-estate visualization commands. JSON only:
{"action":"image"|"video"|"edit","count":1,"preserveCamera":true,"inspiredNotCopy":true,"notes":"English Imagine notes"}
Rules:
- action=video ONLY if they explicitly want video / videoya çevir / walkthrough. oluştur/tasarla/istiyorum is NOT video.
- If a result image is selected (hasSelected) and they say make video / this one / üstteki, action=video on that selected frame.
- count = number of separate stills (iki ayrı fotoğraf → 2), max 6.
- preserveCamera if they want the empty room angle kept.
- inspiredNotCopy unless they say birebir / aynısını kopyala.
- notes: one paragraph for Imagine, insist on original furniture design inspired by refs, never merge two rooms.`,
          },
          {
            role: "user",
            content: `Photos: ${data.photoCount}. Selected result: ${data.hasSelected ? "yes" : "no"}.\n${data.text}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true as const, ...fallback };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const parsed = parseIntentJson(raw);
    if (!parsed) return { ok: true as const, ...fallback };
    return { ok: true as const, ...parsed };
  });

export type StudioIntent = {
  action: "image" | "video" | "edit";
  count: number;
  preserveCamera: boolean;
  inspiredNotCopy: boolean;
  notes: string;
};

export function heuristicIntent(text: string, photoCount: number): StudioIntent {
  const t = text.toLocaleLowerCase("tr-TR");
  const explicitVideo = /\bvideoya\b|\bvideo\s*tur\b|\bwalkthrough\b|\bvideo\s*yap\b|\bvideosu\b/.test(t);
  const wantsPhoto = /\bfotoğraf\b|\bfotograf\b|\bgörsel\b|\biki ayrı\b/.test(t);
  const action: StudioIntent["action"] = explicitVideo && !wantsPhoto ? "video" : "image";
  let count = 1;
  if (/iki ayrı|2 ayrı|iki fotoğraf|iki fotograf|iki açı|iki aci/.test(t)) count = 2;
  else if (/üç ayrı|uc ayrı|3 ayrı|üç fotoğraf/.test(t)) count = 3;
  else if (/dört ayrı|4 ayrı/.test(t)) count = 4;
  count = Math.min(count, Math.max(1, photoCount || count));
  return {
    action,
    count,
    preserveCamera: /koru|orijinal|orjinal|açı.*sabit|aci.*sabit|boş hal|bos hal/.test(t),
    inspiredNotCopy: !/birebir aynı|aynısını kopyala|tıpatıp/.test(t),
    notes: text.slice(0, 800),
  };
}

function parseIntentJson(raw: string): StudioIntent | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const j = JSON.parse(raw.slice(start, end + 1)) as Partial<StudioIntent>;
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
