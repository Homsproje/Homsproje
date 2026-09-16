/** Provider-agnostic contracts. Frontend never sees provider ids. */

export type HomsAiTask = "image" | "video" | "interpret";

export type HomsAiQuality = "1k" | "2k";

export type HomsAiImageRequest = {
  images: string[];
  prompt: string;
  roomType?: string;
  designStyle?: string;
  lighting?: string;
  camera?: string;
  aspectRatio?: string;
  quality?: HomsAiQuality;
};

export type HomsAiVideoRequest = {
  image: string;
  prompt: string;
  roomType?: string;
  designStyle?: string;
  lighting?: string;
  camera?: string;
  aspectRatio?: string;
  duration?: number;
};

export type HomsAiInterpretRequest = {
  text: string;
  photoCount: number;
  hasSelected?: boolean;
};

export type HomsAiOkImage = { ok: true; kind: "image"; url: string };
export type HomsAiOkJob = { ok: true; kind: "job"; jobId: string };
export type HomsAiOkPoll =
  | { ok: true; kind: "video"; status: "pending" }
  | { ok: true; kind: "video"; status: "done"; url: string };
export type HomsAiFail = { ok: false; error: string };

export type HomsAiIntent = {
  ok: true;
  action: "image" | "video" | "edit";
  count: number;
  preserveCamera: boolean;
  inspiredNotCopy: boolean;
  notes: string;
};

export type ProviderId = "xai" | "provider2" | "provider3";
