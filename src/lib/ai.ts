import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  completeAiJob,
  createAiJob,
  hasActiveMembership,
  markAiJobRunning,
  recordUsage,
} from "@/lib/membership.server";
import { assertProjectOwner } from "@/lib/projects.server";
import { isStaffSessionServer } from "@/lib/staff-session.server";

async function assertCanUseAi(userId: string): Promise<string | null> {
  if (await isStaffSessionServer()) return null;
  if (await hasActiveMembership(userId)) return null;
  return "Aktif üyelik gerekli.";
}

async function assertProjectAccess(
  userId: string,
  projectId: string | undefined,
): Promise<string | null> {
  if (!projectId) return null;
  if (await assertProjectOwner(projectId, userId)) return null;
  return "Bu projeye erişim yok.";
}

function makeIdempotencyKey(
  userId: string,
  op: string,
  parts: Record<string, unknown>,
): string {
  const payload = JSON.stringify({ userId, op, ...parts });
  return createHash("sha256").update(payload).digest("hex").slice(0, 48);
}

export function isSafeMediaUrl(raw: string): boolean {
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
  /** Optional client-supplied key; server also derives a stable hash. */
  idempotencyKey: z.string().min(8).max(80).optional(),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => generateInput.parse(input))
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const owned = await assertProjectAccess(context.userId, data.projectId);
    if (owned) return { ok: false as const, error: owned };

    const idem =
      data.idempotencyKey ||
      makeIdempotencyKey(context.userId, "image", {
        prompt: data.prompt,
        aspectRatio: data.aspectRatio,
        resolution: data.resolution,
        projectId: data.projectId ?? null,
        // Hash only first 32 chars of first image to avoid huge keys
        img0: data.images[0]?.slice(0, 64) ?? "",
      });

    const { jobId, reused } = await createAiJob({
      userId: context.userId,
      projectId: data.projectId,
      type: "image",
      input: { prompt: data.prompt, aspectRatio: data.aspectRatio },
      idempotencyKey: idem,
    });

    if (reused) {
      // Job already exists for this key — do not re-bill usage.
      return { ok: true as const, url: "", jobId, reused: true as const };
    }

    await markAiJobRunning(jobId, context.userId);

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
      idempotencyKey: `usage:${idem}`,
    });
    return { ok: true as const, url: res.url, jobId, reused: false as const };
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
  idempotencyKey: z.string().min(8).max(80).optional(),
});

export const startStudioVideo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => videoStartInput.parse(input))
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const owned = await assertProjectAccess(context.userId, data.projectId);
    if (owned) return { ok: false as const, error: owned };

    const idem =
      data.idempotencyKey ||
      makeIdempotencyKey(context.userId, "video_start", {
        prompt: data.prompt,
        duration: data.duration,
        projectId: data.projectId ?? null,
        img: data.image.slice(0, 64),
      });

    const existing = await createAiJob({
      userId: context.userId,
      projectId: data.projectId,
      type: "video",
      input: { prompt: data.prompt, duration: data.duration },
      idempotencyKey: idem,
      status: "pending",
    });

    if (existing.reused) {
      return {
        ok: true as const,
        requestId: "",
        jobId: existing.jobId,
        reused: true as const,
      };
    }

    await markAiJobRunning(existing.jobId, context.userId);

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

    if (!res.ok) {
      await completeAiJob(existing.jobId, context.userId, {
        status: "failed",
        error: res.error,
      });
      // No usage on failed start
      return { ok: false as const, error: res.error };
    }

    // Attach external id
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update ai_jobs
      set external_id = ${res.jobId}, status = 'running'
      where id = ${existing.jobId} and user_id = ${context.userId}
    `;

    await recordUsage({
      userId: context.userId,
      operation: "video_start",
      provider: "xai",
      jobId: existing.jobId,
      idempotencyKey: `usage:${idem}`,
    });

    return {
      ok: true as const,
      requestId: res.jobId,
      jobId: existing.jobId,
      reused: false as const,
    };
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
  idempotencyKey: z.string().min(8).max(80).optional(),
});

export const interpretCommand = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => interpretInput.parse(input))
  .handler(async ({ context, data }) => {
    const denied = await assertCanUseAi(context.userId);
    if (denied)
      return {
        ok: false as const,
        error: denied,
        action: "image" as const,
        count: 1,
        preserveCamera: true,
        inspiredNotCopy: true,
        notes: "",
      };
    const owned = await assertProjectAccess(context.userId, data.projectId);
    if (owned)
      return {
        ok: false as const,
        error: owned,
        action: "image" as const,
        count: 1,
        preserveCamera: true,
        inspiredNotCopy: true,
        notes: "",
      };

    const idem =
      data.idempotencyKey ||
      makeIdempotencyKey(context.userId, "interpret", {
        text: data.text,
        photoCount: data.photoCount,
        projectId: data.projectId ?? null,
      });

    const { homsAi } = await import("@/lib/homs-ai-engine/engine.server");
    const intent = await homsAi.interpret(data);
    await recordUsage({
      userId: context.userId,
      operation: "interpret",
      provider: "xai",
      idempotencyKey: `usage:${idem}`,
    });
    return intent;
  });

export type { HomsAiIntent as StudioIntent } from "@/lib/homs-ai-engine/types";
