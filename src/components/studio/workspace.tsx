import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Folder, ImagePlus, KeyRound, Loader2, Mic, Plus, Send, X, Check } from "lucide-react";
import { toast } from "sonner";
import { ClipPlayer } from "@/components/studio/clip-player";
import { ChatActions, ImageEditOverlay } from "@/components/studio/image-edit-overlay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateStudioImage,
  pollStudioVideo,
  startStudioVideo,
} from "@/lib/ai";
import { CATALOG, type CatalogId } from "@/lib/catalog";
import { VIDEO_CATALOG, type VideoCatalogId } from "@/lib/video-catalog";
import { downloadBrandedImage, downloadImageAspect, downloadUrl, fileBase } from "@/lib/export";
import { errText } from "@/lib/error-component";
import { scoreEmpty } from "@/lib/intent";
import { buildImagePrompt, parseCommand } from "@/lib/homs-engine";
import { CAMERAS, ZONES, AUDIO, buildDirectorPrompt, type CameraId, type ZoneId, type AudioId } from "@/lib/director";
import { CarouselOverlay } from "@/components/studio/carousel";
import { asOk } from "@/lib/safe";
import { fileToDataUrl, toApiImage, uid } from "@/lib/utils";
import { useStudio, type ChatTurn, type SourceImage } from "@/store/studio";

// HOTFIX PLACEHOLDER — full restore content must be applied from artifacts/workspace_restore.tsx
// SHA-256 f256210990e981a6b0d2461e10b5e83fa63ac95f3d8ce2853dc2cbe4b4d6905e
// Local clone has the correct file at homs-ws-restore/
export function Workspace({ chatIdFromUrl }: { chatIdFromUrl?: string }) {
  const ensureProjectDeepLoaded = useStudio((s) => s.ensureProjectDeepLoaded);
  useEffect(() => {
    if (chatIdFromUrl && !chatIdFromUrl.startsWith("demo-")) {
      void ensureProjectDeepLoaded(chatIdFromUrl);
    }
  }, [chatIdFromUrl, ensureProjectDeepLoaded]);
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
      <p>Studio workspace restore bekleniyor.</p>
      <p className="text-xs">artifacts/workspace_restore.tsx → src/components/studio/workspace.tsx</p>
      <Link to="/app" className="underline">App</Link>
    </div>
  );
}
