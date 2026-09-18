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

// NOTE: Full Workspace implementation temporarily reduced during Stage 2.2 restore.
// The complete UI is being restored; deep-load is handled by StudioDbHydrator.
// See branch commits for restore status.

export function Workspace({ chatIdFromUrl }: { chatIdFromUrl?: string }) {
  const ensureProjectDeepLoaded = useStudio((s) => s.ensureProjectDeepLoaded);

  useEffect(() => {
    if (chatIdFromUrl && !chatIdFromUrl.startsWith("demo-")) {
      void ensureProjectDeepLoaded(chatIdFromUrl);
    }
  }, [chatIdFromUrl, ensureProjectDeepLoaded]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Studio workspace dosyası Stage 2.2 sırasında yeniden yükleniyor.
        Deep-load API hazır; tam UI bir sonraki commit ile geri yüklenecek.
      </p>
      <Link to="/app" className="text-sm underline">
        App ana sayfa
      </Link>
    </div>
  );
}
