import { useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, RotateCw, X } from "lucide-react";

export function BrowserChrome() {
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <div className="flex h-11 shrink-0 items-center justify-center gap-2 border-b border-border bg-background">
      <button
        type="button"
        className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]"
        aria-label="Geri"
        onClick={() => router.history.back()}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]"
        aria-label="İleri"
        onClick={() => router.history.forward()}
      >
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]"
        aria-label="Yenile"
        onClick={() => router.invalidate()}
      >
        <RotateCw className="size-4" />
      </button>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-full bg-card shadow-[var(--shadow-border)]"
        aria-label="Kapat"
        onClick={() => void navigate({ to: "/" })}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
