/**
 * Studio ↔ Database synchronization (client-side helpers).
 *
 * Source of truth for authenticated users: Postgres (via projects-api).
 * Zustand/localStorage remains a UI cache so offline/demo UX stays smooth.
 *
 * Staff-only sessions without Better Auth may skip sync (no userId).
 */

import {
  addMyAsset,
  addMyTurn,
  createMyProject,
  deleteMyProject,
  listMyProjects,
  updateMyProject,
} from "@/lib/projects-api";
import type { Project, StudioAsset, ChatTurn } from "@/store/studio";

function isAuthError(err: unknown): boolean {
  return err instanceof Error && err.message === "Unauthorized";
}

/** Load the authenticated user's projects from DB (metadata only). */
export async function loadProjectsFromDb(): Promise<
  | { ok: true; projects: Array<{ id: string; title: string; mode: string; style: string; view: string; brief: string; createdAt: string; updatedAt: string }> }
  | { ok: false; error: string; unauthorized?: boolean }
> {
  try {
    const res = await listMyProjects();
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

/** Persist a newly created Studio project to DB (same id as client). */
export async function persistNewProject(project: Project): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await createMyProject({
      data: {
        id: project.id,
        title: project.title,
        mode: project.mode,
        style: project.style,
        view: project.view,
        brief: project.brief,
      },
    });
    return res.ok ? { ok: true } : { ok: false, error: "Proje kaydedilemedi." };
  } catch (err) {
    if (isAuthError(err)) return { ok: false, error: "Unauthorized" };
    return { ok: false, error: err instanceof Error ? err.message : "Kayıt hatası" };
  }
}

export async function persistProjectPatch(
  projectId: string,
  patch: Partial<Pick<Project, "title" | "mode" | "style" | "view" | "brief">>,
): Promise<{ ok: boolean }> {
  try {
    const res = await updateMyProject({
      data: {
        projectId,
        title: patch.title,
        mode: patch.mode,
        style: patch.style,
        view: patch.view,
        brief: patch.brief,
      },
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export async function persistDeleteProject(projectId: string): Promise<{ ok: boolean }> {
  try {
    const res = await deleteMyProject({ data: { projectId } });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export async function persistAsset(projectId: string, asset: StudioAsset): Promise<{ ok: boolean }> {
  try {
    const res = await addMyAsset({
      data: {
        projectId,
        kind: asset.kind,
        url: asset.url,
        prompt: asset.prompt,
        view: asset.view,
        title: asset.title,
      },
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export async function persistTurn(projectId: string, turn: ChatTurn): Promise<{ ok: boolean }> {
  try {
    const res = await addMyTurn({
      data: {
        projectId,
        role: turn.role,
        text: turn.text,
        kind: turn.kind,
        url: turn.url,
      },
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
