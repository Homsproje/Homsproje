import { fetchMedia } from "@/lib/ai";

export function fileBase(kind: "image" | "video", title = "icerik") {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `homsproje-${slug || kind}-${stamp}`;
}

function triggerBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 4_000);
}

export async function downloadUrl(url: string, filename: string) {
  const packed = await fetchMedia({ data: { url } });
  if (!packed.ok) throw new Error(packed.error);
  const bin = Uint8Array.from(atob(packed.b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bin], { type: packed.mime });
  const file = new File([blob], filename, { type: packed.mime });
  const nav = navigator as Navigator & {
    canShare?: (d: { files: File[] }) => boolean;
    share?: (d: { files: File[]; title?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: filename });
    return;
  }
  triggerBlob(blob, filename);
}

export async function downloadBrandedImage(url: string, filename: string) {
  await downloadUrl(url, filename.endsWith(".jpg") ? filename : `${filename}.jpg`);
}

export async function downloadImageAspect(url: string, filename: string, aspect: "16:9" | "9:16" | "1:1" | "4:3" | "orig") {
  if (aspect === "orig") {
    await downloadBrandedImage(url, filename);
    return;
  }
  const packed = await fetchMedia({ data: { url } });
  if (!packed.ok) throw new Error(packed.error);
  const bin = Uint8Array.from(atob(packed.b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bin], { type: packed.mime });
  const href = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Görsel okunamadı"));
    el.src = href;
  });
  const [aw, ah] = aspect.split(":").map(Number) as [number, number];
  const W = 1600;
  const H = Math.round((W * ah) / aw);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(href);
    await downloadBrandedImage(url, filename);
    return;
  }
  const scale = Math.max(W / img.width, H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  URL.revokeObjectURL(href);
  const out = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kayıt yok"))), "image/jpeg", 0.92);
  });
  triggerBlob(out, filename.endsWith(".jpg") ? filename : `${filename}.jpg`);
}

/** Pack many photos into ≤3 API refs: first, last, and a contact sheet of the rest. */
export async function packApiImages(urls: string[]): Promise<string[]> {
  if (urls.length <= 3) return urls;
  const sheet = await contactSheet(urls);
  return [urls[0], urls[Math.min(1, urls.length - 1)], sheet];
}

async function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel okunamadı"));
    img.src = url;
  });
}

async function contactSheet(urls: string[]): Promise<string> {
  const n = Math.min(15, urls.length);
  const cols = 5;
  const rows = Math.ceil(n / cols);
  const cell = 256;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) return urls[0];
  ctx.fillStyle = "#fef8ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bitmaps = await Promise.all(urls.slice(0, n).map((u) => loadImage(u)));
  bitmaps.forEach((img, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    const scale = Math.max(cell / img.width, cell / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x + (cell - w) / 2, y + (cell - h) / 2, w, h);
  });
  return canvas.toDataURL("image/jpeg", 0.72);
}