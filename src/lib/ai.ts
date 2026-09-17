import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  completeAiJob,
  createAiJob,
  hasActiveMembership,
  recordUsage,
} from "@/lib/membership.server";
import { isStaffSessionServer } from "@/lib/staff-session.server";

/** Allow AI when the caller has an active membership OR a staff session. */
async function assertCanUseAi(userId: string): Promise<string | null> {
  if (await isStaffSessionServer()) return null;
  if (await hasActiveMembership(userId)) return null;
  return "Aktif üyelik gerekli.";
}

/** Block obvious SSRF targets for fetchMedia. */
function isSafeMediaUrl(raw: string): boolean {
  if (raw.startsWith("data:")) return true;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host) ||
    host === "169.254.169.254"
  ) {
    return false;
  }
  return true;
}

const generateInput = z.object({
  prompt: z.string().min(8).max(4000),
  images: z.array(z.string().min(8)).max(3),
  aspectRatio: z.string().default("16:9"),
  resolution: z.enum(["1k", "2k"]).default("1k"),
  roomType: z.string().optional(),
  designStyle: z.string().optional(),
  lighting: z.string().optional(),
  camera: z.string().optional(),
  projectId: z.string().optional(),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => generateInput.parse(input))
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied) return { ok: false as const, error: denied };

    const jobId = await createAiJob({
      userId: context.userId,
      projectId: data.projectId,
      type: "image",
      input: { prompt: data.prompt, aspectRatio: data.aspectRatio },
    });

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

    if (!res.ok) {
      await completeAiJob(jobId, context.userId, { status: "failed", error: res.error });
      return { ok: false as const, error: res.error };
    }

    await completeAiJob(jobId, context.userId, {
      status: "done",
      output: { url: res.url },
    });
    await recordUsage({
      userId: context.userId,
      operation: "image",
      provider: "xai",
      jobId,
    });
    return { ok: true as const, url: res.url, jobId };
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
  projectId: z.string().optional(),
});

export const startStudioVideo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => videoStartInput.parse(input))
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied) return { ok: false as const, error: denied };

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

    const jobId = await createAiJob({
      userId: context.userId,
      projectId: data.projectId,
      type: "video",
      input: { prompt: data.prompt, duration: data.duration },
      externalId: res.jobId,
    });
    await recordUsage({
      userId: context.userId,
      operation: "video_start",
      provider: "xai",
      jobId,
    });
    return { ok: true as const, requestId: res.jobId, jobId };
  });

export const pollStudioVideo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ requestId: z.string().min(4), jobId: z.string().optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied) return { ok: false as const, error: denied };

    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    const res = await homsAi.videoPoll(data.requestId);
    if (!res.ok) {
      if (data.jobId) {
        await completeAiJob(data.jobId, context.userId, { status: "failed", error: res.error });
      }
      return { ok: false as const, error: res.error };
    }
    if (res.status === "done") {
      if (data.jobId) {
        await completeAiJob(data.jobId, context.userId, {
          status: "done",
          output: { url: res.url },
        });
      }
      return { ok: true as const, status: "done" as const, url: res.url };
    }
    return { ok: true as const, status: "pending" as const };
  });

export const checkAiAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { homsAiReady } = await import("@/lib/homs-ai-engine/engine.server");
  return { ok: homsAiReady() };
});

export const fetchMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ url: z.string().min(8) }).parse(input))
  .handler(async ({ data }) => {
    if (!isSafeMediaUrl(data.url)) {
      return { ok: false as const, error: "Bu adres güvenlik nedeniyle engellendi." };
    }
    if (data.url.startsWith("data:")) {
      const m = data.url.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return { ok: false as const, error: "Dosya okunamadı." };
      return { ok: true as const, mime: m[1], b64: m[2] };
    }
    const res = await fetch(data.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
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
  projectId: z.string().optional(),
});

export const interpretCommand = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => interpretInput.parse(input))
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied) return { ok: false as const, error: denied, action: "image" as const, count: 1, preserveCamera: true, inspiredNotCopy: true, notes: "" };

    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    const intent = await homsAi.interpret(data);
    await recordUsage({
      userId: context.userId,
      operation: "interpret",
      provider: "xai",
    });
    return intent;
  });

export type { HomsAiIntent as StudioIntent } from "@/lib/homs-ai-engine/types";
