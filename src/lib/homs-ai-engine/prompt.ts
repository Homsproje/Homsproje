import type { HomsAiImageRequest, HomsAiVideoRequest } from "./types";

export function composeImagePrompt(req: HomsAiImageRequest) {
  return [
    req.prompt,
    req.roomType ? `Room type: ${req.roomType}` : "",
    req.designStyle ? `Design style: ${req.designStyle}` : "",
    req.lighting ? `Lighting: ${req.lighting}` : "",
    req.camera ? `Camera: ${req.camera}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export function composeVideoPrompt(req: HomsAiVideoRequest) {
  return [
    req.prompt,
    req.roomType ? `Room type: ${req.roomType}` : "",
    req.designStyle ? `Design style: ${req.designStyle}` : "",
    req.lighting ? `Lighting: ${req.lighting}` : "",
    req.camera ? `Camera: ${req.camera}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export function publicError(raw: string) {
  const t = raw
    .replace(/xAI|xai|Grok|grok|api\.x\.ai/gi, "AI")
    .replace(/Bearer\s+\S+/g, "")
    .slice(0, 280);
  return t || "AI servisi yanıt vermedi.";
}
