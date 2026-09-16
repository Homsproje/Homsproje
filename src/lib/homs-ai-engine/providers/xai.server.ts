import { heuristicIntent, parseIntentJson } from "../intent";
import { composeImagePrompt, composeVideoPrompt, publicError } from "../prompt";
import type {
  HomsAiFail,
  HomsAiImageRequest,
  HomsAiIntent,
  HomsAiInterpretRequest,
  HomsAiOkImage,
  HomsAiOkJob,
  HomsAiOkPoll,
  HomsAiVideoRequest,
} from "../types";
import type { AiProvider } from "./types";

const IMAGE_MODEL = "grok-imagine-image-2.0";
const VIDEO_MODEL = "grok-imagine-video-1.5";
const CHAT_MODEL = "grok-4.5";

function key() {
  return process.env.XAI_API_KEY?.trim() ?? "";
}

async function readError(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof json.error === "string") return publicError(json.error);
    if (json.error && typeof json.error === "object" && json.error.message) return publicError(json.error.message);
    if (typeof json.message === "string") return publicError(json.message);
  } catch {
    /* ignore */
  }
  return publicError(text);
}

async function persistUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) return url;
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (buf.byteLength > 2_400_000) return url;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export const xaiProvider: AiProvider = {
  id: "xai",

  async image(req: HomsAiImageRequest): Promise<HomsAiOkImage | HomsAiFail> {
    const token = key();
    if (!token) return { ok: false, error: "AI bu ortamda kapalı." };

    const images = req.images.map((url) => ({ type: "image_url" as const, url }));
    const hasSource = images.length > 0;
    const endpoint = hasSource ? "https://api.x.ai/v1/images/edits" : "https://api.x.ai/v1/images/generations";
    const body: Record<string, unknown> = {
      model: IMAGE_MODEL,
      prompt: composeImagePrompt(req),
      aspect_ratio: req.aspectRatio ?? "16:9",
      resolution: req.quality ?? "1k",
      quality: "auto",
      n: 1,
    };
    if (hasSource) {
      if (images.length === 1) body.image = images[0];
      else body.images = images;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: await readError(res) };

    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const first = json.data?.[0];
    let url = first?.url ?? "";
    if (!url && first?.b64_json) url = `data:image/jpeg;base64,${first.b64_json}`;
    if (!url) return { ok: false, error: "Görsel üretilemedi." };
    return { ok: true, kind: "image", url: await persistUrl(url) };
  },

  async videoStart(req: HomsAiVideoRequest): Promise<HomsAiOkJob | HomsAiFail> {
    const token = key();
    if (!token) return { ok: false, error: "AI bu ortamda kapalı." };

    const res = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: VIDEO_MODEL,
        prompt: composeVideoPrompt(req),
        duration: Math.min(15, Math.max(6, req.duration ?? 10)),
        aspect_ratio: req.aspectRatio === "9:16" ? "9:16" : "16:9",
        resolution: "720p",
        image: { url: req.image, type: "image_url" },
      }),
    });
    if (!res.ok) return { ok: false, error: await readError(res) };
    const json = (await res.json()) as { request_id?: string; id?: string };
    const jobId = json.request_id ?? json.id;
    if (!jobId) return { ok: false, error: "Video isteği başlamadı." };
    return { ok: true, kind: "job", jobId };
  },

  async videoPoll(jobId: string): Promise<HomsAiOkPoll | HomsAiFail> {
    const token = key();
    if (!token) return { ok: false, error: "AI bu ortamda kapalı." };

    const res = await fetch(`https://api.x.ai/v1/videos/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: await readError(res) };
    const json = (await res.json()) as {
      status?: string;
      video?: { url?: string };
      url?: string;
      error?: string;
    };
    const status = json.status ?? "pending";
    if (status === "failed" || status === "expired") {
      return { ok: false, error: publicError(json.error || "Video üretimi başarısız.") };
    }
    if (status === "done" || status === "completed") {
      const url = json.video?.url ?? json.url;
      if (!url) return { ok: false, error: "Video adresi yok." };
      return { ok: true, kind: "video", status: "done", url };
    }
    return { ok: true, kind: "video", status: "pending" };
  },

  async interpret(req: HomsAiInterpretRequest): Promise<HomsAiIntent> {
    const fallback = { ok: true as const, ...heuristicIntent(req) };
    const token = key();
    if (!token) return fallback;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: CHAT_MODEL,
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
- notes: one paragraph for image generation, insist on original furniture design inspired by refs, never merge two rooms.`,
          },
          {
            role: "user",
            content: `Photos: ${req.photoCount}. Selected result: ${req.hasSelected ? "yes" : "no"}.\n${req.text}`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = parseIntentJson(json.choices?.[0]?.message?.content ?? "");
    if (!parsed) return fallback;
    return { ok: true, ...parsed };
  },
};
