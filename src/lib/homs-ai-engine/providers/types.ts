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
} from "../types";

export type AiProvider = {
  id: ProviderId;
  image: (req: HomsAiImageRequest) => Promise<HomsAiOkImage | HomsAiFail>;
  videoStart: (req: HomsAiVideoRequest) => Promise<HomsAiOkJob | HomsAiFail>;
  videoPoll: (jobId: string) => Promise<HomsAiOkPoll | HomsAiFail>;
  interpret: (req: HomsAiInterpretRequest) => Promise<HomsAiIntent>;
};
