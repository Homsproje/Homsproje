import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const generateInput = z.object({
  prompt: z.string().min(8).max(4000),
  images: z.array(z.string().min(8)).max(3),
  aspectRatio: z.string().default("16:9"),
  resolution: z.enum(["1k", "2k"]).default("1k"),
  roomType: z.string().optional(),
  designStyle: z.string().optional(),
  lighting: z.string().optional(),
  camera: z.string().optional(),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => generateInput.parse(input))
  .handler(async ({ data }) => {
    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    const res = await homsAi.image({
      images: data.images,
      prompt: data.prompt,
      aspectRatio: data.aspectRatio,
      quality: data.resolution,
      roomType: data.roomType,
      designStyle: data.designStyle,
      lighting: data.lighting,
      camera: data.camera,
    });
    if (!res.ok) return { ok: false as const, error: res.error };
    return { ok: true as const, url: res.url };
  });

const videoStartInput = z.object({
  prompt: z.string().min(8).max(2000),
  image: z.string().min(8),
  duration: z.number().min(6).max(15).default(10),
  aspectRatio: z.string().default("16:9"),
  roomType: z.string().optional(),
  designStyle: z.string().optional(),
  lighting: z.string().optional(),
  camera: z.string().optional(),
});

export const startStudioVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => videoStartInput.parse(input))
  .handler(async ({ data }) => {
    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    const res = await homsAi.videoStart({
      image: data.image,
      prompt: data.prompt,
      duration: data.duration,
      aspectRatio: data.aspectRatio,
      roomType: data.roomType,
      designStyle: data.designStyle,
      lighting: data.lighting,
      camera: data.camera,
    });
    if (!res.ok) return { ok: false as const, error: res.error };
    return { ok: true as const, requestId: res.jobId };
  });

export const pollStudioVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ requestId: z.string().min(4) }).parse(input))
  .handler(async ({ data }) => {
    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    const res = await homsAi.videoPoll(data.requestId);
    if (!res.ok) return { ok: false as const, error: res.error };
    if (res.status === "done") return { ok: true as const, status: "done" as const, url: res.url };
    return { ok: true as const, status: "pending" as const };
  });

export const checkAiAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { homsAiReady } = await import("@/lib/homs-ai-engine/engine.server");
  return { ok: homsAiReady() };
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
    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    return homsAi.interpret(data);
  });

export type { HomsAiIntent as StudioIntent } from "@/lib/homs-ai-engine/types";
