import { type ReactNode } from "react";
import { BrowserChrome } from "@/components/layout/chrome";
import { MemberGate } from "@/components/layout/member-gate";
import { useVisualViewport } from "@/lib/use-visual-viewport";

export function AppFrame({ children }: { children: ReactNode }) {
  const box = useVisualViewport();
  return (
    <MemberGate>
      <div
        className="flex w-full max-w-full flex-col overflow-hidden bg-background text-foreground"
        style={{ position: "fixed", left: 0, right: 0, top: box.top, height: box.height }}
      >
        <BrowserChrome />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </MemberGate>
  );
}
