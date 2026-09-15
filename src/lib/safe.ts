export function asOk<T extends { ok: boolean }>(
  value: T | undefined | null,
  fallback = "Sunucu yanıt vermedi. Yeniden deneyin.",
): T {
  if (value && typeof value === "object" && "ok" in value) return value;
  return { ok: false, error: fallback } as unknown as T;
}
