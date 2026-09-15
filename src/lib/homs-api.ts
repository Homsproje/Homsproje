import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateStudioImage, startStudioVideo } from "@/lib/ai";

const imageIn = z.object({
  token: z.string().min(8),
  prompt: z.string().min(4).max(4000),
  images: z.array(z.string()).max(3).default([]),
  aspectRatio: z.string().default("16:9"),
  resolution: z.enum(["1k", "2k"]).default("1k"),
  origin: z.string().optional(),
});

export const apiGenerateImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => imageIn.parse(input))
  .handler(async ({ data }) => {
    const { gate } = await import("@/lib/api-security.server");
    const err = gate(data.token, data.origin);
    if (err) return { ok: false as const, error: err };
    return generateStudioImage({
      data: {
        prompt: data.prompt,
        images: data.images,
        aspectRatio: data.aspectRatio,
        resolution: data.resolution,
      },
    });
  });

const videoIn = z.object({
  token: z.string().min(8),
  prompt: z.string().min(4).max(2000),
  image: z.string().min(8),
  duration: z.number().min(6).max(15).default(10),
  aspectRatio: z.string().default("16:9"),
  origin: z.string().optional(),
});

export const apiStartVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => videoIn.parse(input))
  .handler(async ({ data }) => {
    const { gate } = await import("@/lib/api-security.server");
    const err = gate(data.token, data.origin);
    if (err) return { ok: false as const, error: err };
    return startStudioVideo({
      data: {
        prompt: data.prompt,
        image: data.image,
        duration: data.duration,
        aspectRatio: data.aspectRatio,
      },
    });
  });
