/**
 * Studio ↔ Database synchronization (client-side helpers).
 *
 * Source of truth for authenticated users: Postgres (via projects-api).
 * Zustand/localStorage remains a UI cache.
 *
 * Stage 2.2: deep-load (assets + turns) and awaited writes with retry.
 */

import {
  addMyAsset,
  addMyTurn,
  createMyProject,
  deleteMyProject,
  getMyProject,
  listMyProjects,
  updateMyProject,
} from "@/lib/projects-api";
import { withRetry } from "@/lib/retry";
import type { Project, StudioAsset, ChatTurn } from "@/store/studio";
import type { StyleId, StudioMode, ViewId } from "@/lib/prompts";

function isAuthError(err: unknown): boolean {
  return err instanceof Error && err.message === "Unauthorized";
}

export type ProjectMeta = {
  id: string;
  title: string;
  mode: string;
  style: string;
  view: string;
  brief: string;
  createdAt: string;
  updatedAt: string;
};

/** Load the authenticated user's projects from DB (metadata only). */
export async function loadProjectsFromDb(): Promise<
  | { ok: true; projects: ProjectMeta[] }
  | { ok: false; error: string; unauthorized?: boolean }
> {
  try {
    const res = await withRetry(() => listMyProjects(), { attempts: 2 });
    if (!res.ok) return { ok: false, error: "Proje listesi alınamadı." };
    return {
      ok: true,
      projects: res.projects.map((p) => ({
        id: p.id,
        title: p.title,
        mode: p.mode,
        style: p.style,
        view: p.view,
        brief: p.brief,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    };
  } catch (err) {
    if (isAuthError(err)) return { ok: false, error: "Unauthorized", unauthorized: true };
    return { ok: false, error: err instanceof Error ? err.message : "Yükleme hatası" };
  }
}

/** Deep-load one project (metadata + assets + turns) with ownership enforced server-side. */
export async function loadProjectDeep(
  projectId: string,
): Promise<{ ok: true; project: Project } | { ok: false; error: string; unauthorized?: boolean }> {
  try {
    const res = await withRetry(() => getMyProject({ data: { projectId } }), { attempts: 2 });
    if (!res.ok) return { ok: false, error: res.error || "Proje bulunamadı." };

    const p = res.project;
    const assets: StudioAsset[] = res.assets.map((a) => ({
      id: a.id,
      kind: (a.kind === "video" ? "video" : "image") as StudioAsset["kind"],
      url: a.url,
      prompt: a.prompt,
      view: (a.view || "living") as ViewId,
      title: a.title ?? undefined,
      createdAt: a.created_at,
    }));
    const thread: ChatTurn[] = res.turns.map((t) => ({
      id: t.id,
      role: t.role === "assistant" ? "assistant" : "user",
      text: t.text,
      kind: t.kind === "video" ? "video" : t.kind === "image" ? "image" : undefined,
      url: t.url ?? undefined,
      createdAt: t.created_at,
    }));

    const project: Project = {
      id: p.id,
      title: p.title,
      mode: p.mode as StudioMode,
      style: p.style as StyleId,
      view: p.view as ViewId,
      brief: p.brief,
      sources: [],
      assets,
      thread,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
    return { ok: true, project };
  } catch (err) {
    if (isAuthError(err)) return { ok: false, error: "Unauthorized", unauthorized: true };
    return { ok: false, error: err instanceof Error ? err.message : "Yükleme hatası" };
  }
}

export async function persistNewProject(
  project: Project,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await withRetry(
      async () =>
        createMyProject({
          data: {
            id: project.id,
            title: project.title,
            mode: project.mode,
            style: project.style,
            view: project.view,
            brief: project.brief,
          },
        }),
      { attempts: 3 },
    );
    return res.ok ? { ok: true } : { ok: false, error: "Proje kaydedilemedi." };
  } catch (err) {
    if (isAuthError(err)) return { ok: false, error: "Unauthorized" };
    return { ok: false, error: err instanceof Error ? err.message : "Kayıt hatası" };
  }
}

export async function persistProjectPatch(
  projectId: string,
  patch: Partial<Pick<Project, "title" | "mode" | "style" | "view" | "brief">>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await withRetry(
      async () =>
        updateMyProject({
          data: {
            projectId,
            title: patch.title,
            mode: patch.mode,
            style: patch.style,
            view: patch.view,
            brief: patch.brief,
          },
        }),
      { attempts: 3 },
    );
    return res.ok ? { ok: true } : { ok: false, error: "Proje güncellenemedi." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Güncelleme hatası" };
  }
}

export async function persistDeleteProject(
  projectId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await withRetry(
      async () => deleteMyProject({ data: { projectId } }),
      { attempts: 3 },
    );
    return res.ok ? { ok: true } : { ok: false, error: "Proje silinemedi." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Silme hatası" };
  }
}

export async function persistAsset(
  projectId: string,
  asset: StudioAsset,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await withRetry(
      async () =>
        addMyAsset({
          data: {
            projectId,
            id: asset.id,
            kind: asset.kind,
            url: asset.url,
            prompt: asset.prompt,
            view: asset.view,
            title: asset.title,
          },
        }),
      { attempts: 3 },
    );
    return res.ok ? { ok: true } : { ok: false, error: "Görsel kaydedilemedi." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Kayıt hatası" };
  }
}

export async function persistTurn(
  projectId: string,
  turn: ChatTurn,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await withRetry(
      async () =>
        addMyTurn({
          data: {
            projectId,
            id: turn.id,
            role: turn.role,
            text: turn.text,
            kind: turn.kind,
            url: turn.url,
          },
        }),
      { attempts: 3 },
    );
    return res.ok ? { ok: true } : { ok: false, error: "Mesaj kaydedilemedi." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Kayıt hatası" };
  }
}
