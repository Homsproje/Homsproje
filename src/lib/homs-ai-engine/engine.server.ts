import { homsAiConfig } from "./config.server";
import { provider2, provider3 } from "./providers/stub.server";
import type { AiProvider } from "./providers/types";
import { xaiProvider } from "./providers/xai.server";
import type {
  HomsAiFail,
  HomsAiImageRequest,
  HomsAiIntent,
  HomsAiInterpretRequest,
  HomsAiOkImage,
  HomsAiOkJob,
  HomsAiOkPoll,
  HomsAiVideoRequest,
  ProviderId,
} from "./types";

const registry: Record<ProviderId, AiProvider> = {
  xai: xaiProvider,
  provider2,
  provider3,
};

function pick(): AiProvider {
  const { provider, fallback } = homsAiConfig();
  return registry[provider] ?? registry[fallback] ?? xaiProvider;
}

export const homsAi = {
  image(req: HomsAiImageRequest): Promise<HomsAiOkImage | HomsAiFail> {
    return pick().image(req);
  },
  videoStart(req: HomsAiVideoRequest): Promise<HomsAiOkJob | HomsAiFail> {
    return pick().videoStart(req);
  },
  videoPoll(jobId: string): Promise<HomsAiOkPoll | HomsAiFail> {
    return pick().videoPoll(jobId);
  },
  interpret(req: HomsAiInterpretRequest): Promise<HomsAiIntent> {
    return pick().interpret(req);
  },
};

export function homsAiReady() {
  if (homsAiConfig().provider === "xai") return Boolean(process.env.XAI_API_KEY?.trim());
  return false;
}
