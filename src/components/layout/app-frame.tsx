import { type ReactNode } from "react";
import { StaffGate } from "@/components/layout/staff-gate";
import { useVisualViewport } from "@/lib/use-visual-viewport";

export function AppFrame({ children }: { children: ReactNode }) {
  const box = useVisualViewport();
  return (
    <StaffGate>
      <div
        className="flex w-full max-w-full flex-col overflow-hidden bg-background text-foreground"
        style={{ position: "fixed", left: 0, right: 0, top: box.top, height: box.height }}
      >
        {children}
      </div>
    </StaffGate>
  );
}
