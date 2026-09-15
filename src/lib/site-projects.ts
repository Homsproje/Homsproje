import type { RegionId } from "@/lib/site";

export type SiteClip = { id: string; title: string; url: string; kind: "image" | "video" };

export type SiteProject = {
  id: string;
  region: RegionId;
  name: string;
  clips: SiteClip[];
};

const KEY = "homs-site-projects-v1";

export function loadProjects(): SiteProject[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as SiteProject[];
  } catch {
    return [];
  }
}

export function saveProjects(list: SiteProject[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
