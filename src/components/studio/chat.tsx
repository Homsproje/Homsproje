import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatTurn } from "@/store/studio";

export function ReviseChat({
  turns,
  busy,
  onSend,
}: {
  turns: ChatTurn[];
  busy: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = text.trim();
    if (!next || busy) return;
    onSend(next);
    setText("");
  }

  return (
    <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
      <p className="text-kicker uppercase tracking-kicker text-muted-foreground">Revize sohbeti</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Aynı kare üzerinde: “kanepeleri yeşil yap”, “avize ekle”, “bunu da yap”.
      </p>
      <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
        {turns.map((t) => (
          <li
            key={t.id}
            className={`rounded-2xl px-3 py-2 text-sm ${t.role === "user" ? "bg-muted" : "bg-background shadow-[var(--shadow-border)]"}`}
          >
            <span className="text-kicker uppercase tracking-kicker text-subtle">
              {t.role === "user" ? "Siz" : "Homs"}
            </span>
            <p className="mt-1">{t.text}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Şunu da ekler misin…"
          disabled={busy}
        />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Gönder">
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
