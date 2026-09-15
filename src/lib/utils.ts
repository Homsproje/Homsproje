import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return crypto.randomUUID();
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Resize an image file to a JPEG data URL suitable for the Imagine API. */
export async function fileToDataUrl(file: File, maxEdge = 1024, quality = 0.74): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function blobUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  const blob = await res.blob();
  const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
  return fileToDataUrl(file);
}

/** Turn a local path, remote URL, or data URL into something the Imagine API can read. */
export async function toApiImage(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  if (url.startsWith("blob:")) return blobUrlToDataUrl(url);
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return await blobUrlToDataUrl(url);
    } catch {
      return url;
    }
  }
  const res = await fetch(url);
  const blob = await res.blob();
  const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
  return fileToDataUrl(file);
}
