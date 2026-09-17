import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import * as projects from "@/lib/projects.server";

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const rows = await projects.listProjects(context.userId);
    return { ok: true as const, projects: rows };
  });

export const getMyProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ projectId: z.string().min(4) }).parse(input))
  .handler(async ({ context, data }) => {
    const project = await projects.getProject(data.projectId, context.userId);
    if (!project) return { ok: false as const, error: "Proje bulunamadı." };
    const assets = await projects.listAssets(data.projectId, context.userId);
    const turns = await projects.listTurns(data.projectId, context.userId);
    return { ok: true as const, project, assets, turns };
  });

export const createMyProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        mode: z.string().min(1).max(40),
        style: z.string().min(1).max(40),
        view: z.string().min(1).max(40),
        brief: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const project = await projects.createProject(context.userId, data);
    return { ok: true as const, project };
  });

export const updateMyProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        projectId: z.string().min(4),
        title: z.string().min(1).max(200).optional(),
        mode: z.string().min(1).max(40).optional(),
        style: z.string().min(1).max(40).optional(),
        view: z.string().min(1).max(40).optional(),
        brief: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { projectId, ...patch } = data;
    const project = await projects.updateProject(projectId, context.userId, patch);
    if (!project) return { ok: false as const, error: "Proje bulunamadı." };
    return { ok: true as const, project };
  });

export const deleteMyProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ projectId: z.string().min(4) }).parse(input))
  .handler(async ({ context, data }) => {
    const ok = await projects.deleteProject(data.projectId, context.userId);
    return ok ? { ok: true as const } : { ok: false as const, error: "Proje bulunamadı." };
  });

export const addMyAsset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        projectId: z.string().min(4),
        kind: z.string().min(1).max(40),
        url: z.string().min(8),
        prompt: z.string().max(4000).optional(),
        role: z.string().max(40).optional(),
        view: z.string().max(40).optional(),
        title: z.string().max(200).optional(),
        storageKey: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const asset = await projects.addAsset(context.userId, data);
    if (!asset) return { ok: false as const, error: "Proje bulunamadı." };
    return { ok: true as const, asset };
  });

export const addMyTurn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        projectId: z.string().min(4),
        role: z.enum(["user", "assistant"]),
        text: z.string().max(8000),
        kind: z.string().max(40).optional(),
        url: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const turn = await projects.addTurn(context.userId, data);
    if (!turn) return { ok: false as const, error: "Proje bulunamadı." };
    return { ok: true as const, turn };
  });
