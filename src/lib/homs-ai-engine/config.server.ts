import type { ProviderId } from "./types";

const KNOWN: ProviderId[] = ["xai", "provider2", "provider3"];

function read(name: string) {
  return process.env[name]?.trim() || "";
}

function asProvider(raw: string, fallback: ProviderId): ProviderId {
  return KNOWN.includes(raw as ProviderId) ? (raw as ProviderId) : fallback;
}

/** Central switch. Change HOMS_AI_PROVIDER without touching frontend. */
export function homsAiConfig() {
  return {
    provider: asProvider(read("HOMS_AI_PROVIDER") || "xai", "xai"),
    fallback: asProvider(read("HOMS_AI_FALLBACK"), "xai"),
  };
}
