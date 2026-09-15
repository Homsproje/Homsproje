import { ALL_ROOMS, REGIONS } from "@/lib/site";

export type FormConfig = {
  regions: { id: string; name: string }[];
  rooms: string[];
  budgets: string[];
  purposes: string[];
  extra: { id: string; label: string; options: string[] }[];
  whatsapp: string;
};

const KEY = "homs-form-v1";

export const DEFAULT_FORM: FormConfig = {
  regions: REGIONS.map((r) => ({ id: r.id, name: r.name })),
  rooms: ALL_ROOMS,
  budgets: ["3–5 M ₺", "5–8 M ₺", "8–12 M ₺", "12–18 M ₺", "18–25 M ₺", "25 M ₺+"],
  purposes: ["Yatırım", "Oturum"],
  extra: [],
  whatsapp: "",
};

export function loadForm(): FormConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_FORM;
    return { ...DEFAULT_FORM, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FORM;
  }
}

export function saveForm(next: FormConfig) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
