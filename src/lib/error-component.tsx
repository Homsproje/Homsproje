import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "Beklenmeyen bir hata oluştu. Sayfayı yenileyin.";

export function errText(error: unknown): string {
  let raw = "";
  if (error instanceof Error && error.message) raw = error.message;
  else if (typeof error === "string") raw = error;
  else if (error && typeof error === "object") {
    const o = error as { message?: unknown; error?: unknown };
    if (typeof o.message === "string") raw = o.message;
    else if (typeof o.error === "string") raw = o.error;
    else {
      try {
        raw = JSON.stringify(error).slice(0, 280);
      } catch {
        raw = "";
      }
    }
  }
  if (/quota/i.test(raw)) return "Günlük üretim hakkı doldu. Biraz sonra yeniden deneyin.";
  if (/load failed/i.test(raw)) return "Dosya alınamadı. İndir’e tekrar basın.";
  return raw || FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <span className="text-destructive" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl font-medium">Bir şey ters gitti</h1>
      <p className="max-w-md text-sm break-words text-muted-foreground">{errText(error)}</p>
    </main>
  );
}
