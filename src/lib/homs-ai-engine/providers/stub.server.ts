import { heuristicIntent } from "../intent";
import type { AiProvider } from "./types";
import type { ProviderId } from "../types";

function unused(id: ProviderId): AiProvider {
  return {
    id,
    image: async () => ({ ok: false, error: "Bu AI sağlayıcısı henüz bağlı değil." }),
    videoStart: async () => ({ ok: false, error: "Bu AI sağlayıcısı henüz bağlı değil." }),
    videoPoll: async () => ({ ok: false, error: "Bu AI sağlayıcısı henüz bağlı değil." }),
    interpret: async (req) => ({ ok: true, ...heuristicIntent(req) }),
  };
}

/** Slots for the next vendors. Wire keys in hosting secrets when ready. */
export const provider2 = unused("provider2");
export const provider3 = unused("provider3");
