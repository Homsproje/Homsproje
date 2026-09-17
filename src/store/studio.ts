import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import type { StudioMode, StyleId, ViewId } from "@/lib/prompts";
import {
  persistAsset,
  persistDeleteProject,
  persistNewProject,
  persistProjectPatch,
  persistTurn,
} from "@/lib/studio-sync";

export type AssetKind = "image" | "video";

export type StudioAsset = {
  id: string;
  kind: AssetKind;
  url: string;
  clips?: string[];
  prompt: string;
  view: ViewId;
  title?: string;
  createdAt: string;
};

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  url?: string;
  clips?: string[];
  still?: string;
  kind?: AssetKind;
  suggestions?: string[];
  createdAt: string;
};

export type SourceImage = {
  id: string;
  url: string;
  name: string;
  role?: "room" | "ref";
  emptyScore?: number;
};

export type Project = {
  id: string;
  title: string;
  mode: StudioMode;
  style: StyleId;
  view: ViewId;
  brief: string;
  sources: SourceImage[];
  assets: StudioAsset[];
  thread: ChatTurn[];
  createdAt: string;
  updatedAt: string;
};

type StudioState = {
  projects: Project[];
  /** True after a successful DB hydrate for the current session. */
  dbHydrated: boolean;
  hydrateFromDb: (
    rows: Array<{
      id: string;
      title: string;
      mode: string;
      style: string;
      view: string;
      brief: string;
      createdAt: string;
      updatedAt: string;
    }>,
  ) => void;
  createProject: (partial: Pick<Project, "title" | "mode" | "style" | "view" | "brief" | "sources">) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addAsset: (id: string, asset: Omit<StudioAsset, "id" | "createdAt">) => StudioAsset | null;
  addTurn: (id: string, turn: Omit<ChatTurn, "id" | "createdAt">) => void;
  removeTurn: (id: string, turnId: string) => void;
  removeProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
};

const DEMO: Project[] = [
  {
    id: "demo-plan",
    title: "Nişantaşı 3+1 — plan",
    mode: "plan",
    style: "warm",
    view: "isometric",
    brief: "Güney bakış, iki yatak, açık mutfak, balkon.",
    sources: [],
    assets: [
      {
        id: "a1",
        kind: "image",
        url: "/samples/isometric.jpg",
        prompt: "isometric",
        view: "isometric",
        createdAt: new Date().toISOString(),
      },
    ],
    thread: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-furnish",
    title: "Boş salon — sıcak çağdaş",
    mode: "furnish",
    style: "warm",
    view: "living",
    brief: "Keten, traverten, zeytin ağacı.",
    sources: [],
    assets: [
      {
        id: "a2",
        kind: "image",
        url: "/samples/furnished-living.jpg",
        prompt: "furnish",
        view: "living",
        createdAt: new Date().toISOString(),
      },
    ],
    thread: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-exterior",
    title: "Cihangir cephe — alacakaranlık",
    mode: "exterior",
    style: "istanbul",
    view: "dusk",
    brief: "Kireçtaşı cephe, dar balkon.",
    sources: [],
    assets: [
      {
        id: "a3",
        kind: "image",
        url: "/samples/exterior.jpg",
        prompt: "exterior",
        view: "dusk",
        createdAt: new Date().toISOString(),
      },
    ],
    thread: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function toProjectRow(row: {
  id: string;
  title: string;
  mode: string;
  style: string;
  view: string;
  brief: string;
  createdAt: string;
  updatedAt: string;
}): Project {
  return {
    id: row.id,
    title: row.title,
    mode: row.mode as StudioMode,
    style: row.style as StyleId,
    view: row.view as ViewId,
    brief: row.brief,
    sources: [],
    assets: [],
    thread: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      projects: DEMO,
      dbHydrated: false,

      hydrateFromDb: (rows) => {
        // DB is source of truth for authenticated users. Keep demo projects only
        // when the account has zero remote projects (empty onboarding).
        const remote = rows.map(toProjectRow);
        const localOnly = get().projects.filter(
          (p) => !p.id.startsWith("demo-") && !remote.some((r) => r.id === p.id),
        );
        // Merge: remote first, then any local-only that may still be syncing.
        const byId = new Map<string, Project>();
        for (const p of remote) byId.set(p.id, p);
        for (const p of localOnly) {
          if (!byId.has(p.id)) byId.set(p.id, p);
        }
        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        set({ projects: merged.length ? merged : DEMO, dbHydrated: true });
      },

      createProject: (partial) => {
        const now = new Date().toISOString();
        const project: Project = {
          id: uid(),
          assets: [],
          thread: [],
          createdAt: now,
          updatedAt: now,
          ...partial,
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        // Fire-and-forget DB persist (authenticated sessions).
        void persistNewProject(project);
        return project;
      },

      updateProject: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        }));
        void persistProjectPatch(id, {
          title: patch.title,
          mode: patch.mode,
          style: patch.style,
          view: patch.view,
          brief: patch.brief,
        });
      },

      addAsset: (id, asset) => {
        const next: StudioAsset = { ...asset, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, assets: [next, ...p.assets], updatedAt: new Date().toISOString() }
              : p,
          ),
        }));
        void persistAsset(id, next);
        return next;
      },

      addTurn: (id, turn) => {
        const next: ChatTurn = { ...turn, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, thread: [...(p.thread ?? []), next], updatedAt: new Date().toISOString() } : p,
          ),
        }));
        void persistTurn(id, next);
      },

      removeTurn: (id, turnId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, thread: (p.thread ?? []).filter((t) => t.id !== turnId), updatedAt: new Date().toISOString() }
              : p,
          ),
        })),

      removeProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        void persistDeleteProject(id);
      },

      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: "homs-proje-studio",
      // Cache only — DB is authoritative when authenticated.
      partialize: (s) => ({
        projects: s.projects.map((p) => ({
          ...p,
          sources: [],
          assets: p.assets.slice(0, 20),
          thread: (p.thread ?? []).slice(-16),
        })),
      }),
      merge: (persisted, current) => {
        const p = persisted as { projects?: Project[] } | undefined;
        if (!p?.projects) return current;
        return {
          ...current,
          projects: p.projects.map((proj) => ({
            ...proj,
            thread: proj.thread ?? [],
            assets: proj.assets ?? [],
            sources: proj.sources ?? [],
          })),
        };
      },
    },
  ),
);
