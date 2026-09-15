export type StudioMode = "plan" | "furnish" | "exterior" | "video";

export type StyleId =
  | "modern"
  | "scandi"
  | "mediterranean"
  | "industrial"
  | "istanbul"
  | "japandi"
  | "warm"
  | "boutique";

export type ViewId =
  | "living"
  | "kitchen"
  | "bedroom"
  | "bath"
  | "entry"
  | "isometric"
  | "facade"
  | "dusk"
  | "aerial";

export type TechniqueId =
  | "dollhouse"
  | "eyelevel"
  | "massing"
  | "section"
  | "axonometric"
  | "facade-plan";

export type ShellFinish = "empty" | "furnished";

export type IntentId = "furnish" | "empty" | "garden" | "facade" | "plan" | "image" | "video";

export const TECHNIQUES: {
  id: TechniqueId;
  kicker: string;
  label: string;
  hint: string;
  body: string;
  views: ViewId[];
  aspect: "4:3" | "16:9";
  prompt: string;
}[] = [
  {
    id: "dollhouse",
    kicker: "01",
    label: "İzometrik kesit",
    hint: "Çatı açık, tüm plan",
    body: "Planı çatısı alınmış bir 3D maket gibi okur.",
    views: ["isometric"],
    aspect: "4:3",
    prompt:
      "Isometric dollhouse cutaway of the entire apartment with the roof removed, matching the floor plan exactly. Physical architectural model photography on a limestone plinth.",
  },
  {
    id: "eyelevel",
    kicker: "02",
    label: "Göz hizası iç",
    hint: "Fotogerçek oda karesi",
    body: "Plandaki odayı 24 mm göz hizasında fotoğraflar.",
    views: ["living", "kitchen", "bedroom", "bath", "entry"],
    aspect: "16:9",
    prompt:
      "Photorealistic eye-level interior photograph of the room indicated by the floor plan. 24mm architectural camera, natural daylight.",
  },
  {
    id: "massing",
    kicker: "03",
    label: "Kütle modeli",
    hint: "Beyaz hacim, orantı",
    body: "Malzeme yok. Planın 3D hacmini netleştirir.",
    views: ["isometric", "aerial", "facade"],
    aspect: "4:3",
    prompt:
      "White architectural massing model derived from the floor plan. Matte plaster, no furniture, no people. Soft studio lighting.",
  },
  {
    id: "section",
    kicker: "04",
    label: "Kesit perspektif",
    hint: "Duvar açılmış bakış",
    body: "Daireyi kesilmiş bir maket gibi okur.",
    views: ["living", "isometric"],
    aspect: "16:9",
    prompt:
      "Cutaway perspective section through the apartment, one wall removed, photoreal interior visible in correct depth.",
  },
  {
    id: "axonometric",
    kicker: "05",
    label: "Aksonometrik pafta",
    hint: "Teknik 3D çizim",
    body: "Satış paftası dilinde çizgisel 3D.",
    views: ["isometric"],
    aspect: "4:3",
    prompt:
      "Clean axonometric architectural drawing of the apartment from the plan, linework and light fills, no people, no logos.",
  },
  {
    id: "facade-plan",
    kicker: "06",
    label: "Plandan cephe",
    hint: "Kütleden sokak",
    body: "Plandaki kütleyi sokak cephesine çevirir.",
    views: ["facade", "dusk"],
    aspect: "16:9",
    prompt:
      "Street facade of the residential building implied by the floor plan, Istanbul street, late afternoon.",
  },
];

export const STYLES: { id: StyleId; label: string; hint: string; prompt: string }[] = [
  {
    id: "modern",
    label: "Modern minimal",
    hint: "Sade hat, açık zemin",
    prompt: "modern minimal interior, pale plaster, slim black details, quiet geometry",
  },
  {
    id: "scandi",
    label: "İskandinav",
    hint: "Açık ahşap, keten",
    prompt: "Scandinavian interior, light oak, linen, white walls, soft daylight",
  },
  {
    id: "mediterranean",
    label: "Akdeniz",
    hint: "Kireç badana, pişmiş toprak",
    prompt: "Mediterranean interior, limewash, terracotta, woven textures, sun-washed plaster",
  },
  {
    id: "industrial",
    label: "Endüstriyel",
    hint: "Beton, çelik, tuğla",
    prompt: "industrial loft, raw plaster, black steel, pale concrete floors, leather",
  },
  {
    id: "istanbul",
    label: "İstanbul klasik",
    hint: "Mermer, pirinç, ahşap",
    prompt: "Istanbul apartment, pale marble, walnut millwork, brass, tall windows, not ornate",
  },
  {
    id: "japandi",
    label: "Japandi",
    hint: "Düşük mobilya, sakin",
    prompt: "Japandi interior, low furniture, pale ash, stone, negative space, muted earth",
  },
  {
    id: "warm",
    label: "Sıcak çağdaş",
    hint: "Traverten, keten, meşe",
    prompt: "warm contemporary interior, travertine, oat linen, oak, sculptural lighting",
  },
  {
    id: "boutique",
    label: "Butik lüks",
    hint: "Taş, kadife, ışık",
    prompt: "boutique luxury apartment, honed stone, muted velvet, custom millwork, gallery light",
  },
];

export const VIEWS: { id: ViewId; label: string; modes: StudioMode[]; prompt: string }[] = [
  {
    id: "living",
    label: "Salon",
    modes: ["plan", "furnish", "video"],
    prompt: "eye-level wide shot of the living room, 24mm, looking toward the main window",
  },
  {
    id: "kitchen",
    label: "Mutfak",
    modes: ["plan", "furnish", "video"],
    prompt: "eye-level view of the kitchen and dining area, natural window light",
  },
  {
    id: "bedroom",
    label: "Yatak odası",
    modes: ["plan", "furnish", "video"],
    prompt: "calm bedroom interior, eye-level, morning light",
  },
  {
    id: "bath",
    label: "Banyo",
    modes: ["plan", "furnish"],
    prompt: "spa-like bathroom interior, stone and plaster, natural light",
  },
  {
    id: "entry",
    label: "Hol",
    modes: ["plan", "furnish"],
    prompt: "entry hall looking into the living space",
  },
  {
    id: "isometric",
    label: "İzometrik 3D",
    modes: ["plan"],
    prompt: "isometric dollhouse architectural visualization with the roof removed",
  },
  {
    id: "facade",
    label: "Cephe",
    modes: ["plan", "exterior", "video"],
    prompt: "street-level architectural photograph of the building facade, late afternoon",
  },
  {
    id: "dusk",
    label: "Alacakaranlık",
    modes: ["exterior", "video", "plan"],
    prompt: "dusk exterior, warm interior lights in the windows, wet pavement",
  },
  {
    id: "aerial",
    label: "Kuş bakışı",
    modes: ["exterior", "plan"],
    prompt: "elevated three-quarter aerial of the residential building, golden hour",
  },
];

export const MODES: {
  id: StudioMode;
  kicker: string;
  label: string;
  title: string;
  body: string;
  sampleSrc: string;
}[] = [
  {
    id: "plan",
    kicker: "01",
    label: "Plan → 3D",
    title: "Çizimi üçe çevirin",
    body: "Kat planı, kroki veya CAD çıktısından izometrik, iç kare veya cephe.",
    sampleSrc: "/samples/isometric.jpg",
  },
  {
    id: "furnish",
    kicker: "02",
    label: "Boş daire döşeme",
    title: "Mobilyasız odayı tasarlayın",
    body: "Boş salon, mutfak veya yatak odasını seçtiğiniz üslupta döşeyin.",
    sampleSrc: "/samples/furnished-living.jpg",
  },
  {
    id: "exterior",
    kicker: "03",
    label: "Dış cephe",
    title: "Sokağın renderı",
    body: "Cephe fotoğrafı veya plandan alacakaranlık sokak karesi.",
    sampleSrc: "/samples/exterior.jpg",
  },
  {
    id: "video",
    kicker: "04",
    label: "Video tur",
    title: "Kareden yürüyüş",
    body: "Üretilen görseli yavaş bir iç tur videosuna çevirin.",
    sampleSrc: "/samples/furnished-living.jpg",
  },
];

export const INTENTS: { id: IntentId; label: string; hint: string }[] = [
  { id: "furnish", label: "Döşe", hint: "Boş odayı mobilyala" },
  { id: "empty", label: "Boşalt", hint: "Mobilyayı kaldır" },
  { id: "garden", label: "Bahçe", hint: "Dış ve peyzaj" },
  { id: "facade", label: "Cephe", hint: "Bina render" },
  { id: "plan", label: "Plan", hint: "Kat planı / kroki" },
  { id: "image", label: "Görsel", hint: "Serbest kare" },
  { id: "video", label: "Video", hint: "Tur / hareket" },
];

export const PALETTES: { id: string; label: string; prompt: string }[] = [
  { id: "cream", label: "Krem / ceviz", prompt: "cream plaster, walnut millwork, oat linen, warm bronze" },
  { id: "olive", label: "Zeytin / taş", prompt: "olive upholstery, honed limestone, blackened metal, dry branches" },
  { id: "sand", label: "Kum / keten", prompt: "sand plaster, raw linen, pale oak, travertine" },
  { id: "night", label: "Gece bronz", prompt: "dusk interior, bronze lamps, dark wood, warm pools of light" },
  { id: "white", label: "Beyaz meşe", prompt: "gallery white walls, white oak, thin black frames, quiet daylight" },
  { id: "charcoal", label: "Antrasit / pirinç", prompt: "charcoal millwork, brushed brass, smoked glass, stone floors" },
];

const SHARED =
  "High-end architectural visualization, physically based materials, correct perspective, no people, no text, no captions, no watermarks, no logos, no UI chrome, no dimension numbers.";

export function techniqueById(id: TechniqueId) {
  return TECHNIQUES.find((t) => t.id === id) ?? TECHNIQUES[0];
}

export function buildImagePrompt(opts: {
  mode: StudioMode;
  style: StyleId;
  view: ViewId;
  brief: string;
  hasSource: boolean;
  technique?: TechniqueId;
  finish?: ShellFinish;
}): string {
  const style = STYLES.find((s) => s.id === opts.style) ?? STYLES[0];
  const view = VIEWS.find((v) => v.id === opts.view) ?? VIEWS[0];
  const brief = opts.brief.trim();
  const technique = opts.technique ? techniqueById(opts.technique) : undefined;
  const finish =
    opts.finish ?? (technique?.id === "massing" || technique?.id === "axonometric" ? "empty" : "furnished");

  if (opts.mode === "plan") {
    const occupancy =
      technique?.id === "massing" || technique?.id === "axonometric"
        ? "No furniture."
        : finish === "empty"
          ? "Keep the space as an empty luminous shell. No furniture."
          : `Furnish quietly in this language: ${style.prompt}.`;
    return [
      "Interpret the uploaded architectural floor plan or sketch as the exact spatial source of truth.",
      technique ? technique.prompt : `Produce a ${view.prompt}.`,
      `Camera / room: ${view.prompt}.`,
      occupancy,
      brief ? `Designer brief: ${brief}.` : "",
      SHARED,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (opts.mode === "furnish") {
    return [
      opts.hasSource
        ? "Furnish this empty room photograph. Keep camera, architecture, windows, and proportions."
        : "Photoreal furnished interior of an empty Istanbul apartment.",
      `Style: ${style.prompt}.`,
      `Camera: ${view.prompt}.`,
      brief ? `Designer brief: ${brief}.` : "",
      SHARED,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (opts.mode === "exterior") {
    return [
      opts.hasSource
        ? "Redesign or complete the building exterior from the uploaded photo or plan."
        : "Contemporary mid-rise residential facade on an Istanbul street.",
      `Style: ${style.prompt}.`,
      `Camera: ${view.prompt}.`,
      brief ? `Designer brief: ${brief}.` : "",
      SHARED,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "Cinematic still of a real-estate walkthrough, ready to animate.",
    `Style: ${style.prompt}.`,
    `Camera: ${view.prompt}.`,
    brief ? `Brief: ${brief}.` : "",
    SHARED,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildEditPrompt(opts: { instruction: string; brief?: string }) {
  const instruction = opts.instruction.trim();
  return [
    "Edit this exact photograph. Keep camera position, architecture, window light, and room proportions.",
    "Apply only the requested change.",
    `Requested change: ${instruction}.`,
    opts.brief ? `Original brief still applies: ${opts.brief}.` : "",
    SHARED,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildVideoPrompt(opts: { mode: StudioMode; view: ViewId; brief: string; beat?: number }) {
  const view = VIEWS.find((v) => v.id === opts.view);
  const brief = opts.brief.trim();
  const motion =
    opts.view === "facade" || opts.view === "dusk" || opts.view === "aerial"
      ? "Slow gimbal / steadicam along the facade, curtains barely moving, lights warm in the windows, one continuous take."
      : "Slow gimbal walkthrough through the room as if a cameraman is touring the apartment. Smooth steadicam, no cuts, no morphing walls, luxury listing tour.";
  const beat =
    opts.beat === 1
      ? "Continue the walkthrough into the next space."
      : opts.beat === 2
        ? "Continue toward the windows, slow pan."
        : opts.beat === 3
          ? "Final reveal of the main room, settle on a still."
          : opts.beat && opts.beat > 3
            ? "Continue the tour, new angle, same architecture."
            : "";
  return [motion, beat, "Keep architecture stable, no morphing walls, no people, no text.", view ? view.prompt : "", brief]
    .filter(Boolean)
    .join(" ");
}

export function buildChatPrompt(opts: {
  intent: IntentId;
  style: StyleId;
  palette: string;
  text: string;
  hasSource: boolean;
}): string {
  const style = STYLES.find((s) => s.id === opts.style) ?? STYLES[0];
  const palette = PALETTES.find((p) => p.id === opts.palette) ?? PALETTES[0];
  const text = opts.text.trim();
  const task =
    opts.intent === "furnish"
      ? "Furnish this empty room. Keep walls, windows, floor, ceiling, and camera."
      : opts.intent === "empty"
        ? "Remove all furniture, rugs, and styling objects. Keep architecture, windows, and lighting."
        : opts.intent === "garden"
          ? "Design the garden, terrace, or landscape around this property."
          : opts.intent === "facade"
            ? "Architectural exterior render of this building."
            : opts.intent === "plan"
              ? "Interpret the sketch or floor plan as spatial truth."
              : "Create a photoreal real-estate still from the instruction.";
  return [
    text ? `Follow this instruction exactly: ${text}` : "",
    task,
    opts.hasSource
      ? "Use the uploaded photographs as the spatial and product reference. Match furniture pieces when the user says they are references."
      : "No source photo — invent a plausible Istanbul residential setting.",
    `Furniture language: ${style.prompt}.`,
    `Color palette: ${palette.prompt}.`,
    SHARED,
  ]
    .filter(Boolean)
    .join(" ");
}

export function suggestChips(intent: IntentId, lastKind: "image" | "video"): string[] {
  if (lastKind === "video") {
    return ["Bir sahne daha ekle", "Daha yavaş kamera", "Gece versiyonu", "Dışarıdan başlat"];
  }
  if (intent === "furnish") {
    return ["Bunu videoya çevir", "Gece ışığı ekle", "Mobilyaları kaldır", "Başka açıdan çek"];
  }
  if (intent === "empty") {
    return ["Şimdi döşe", "Videoya çevir", "Daha geniş açı", "Akşam ışığı"];
  }
  if (intent === "garden" || intent === "facade") {
    return ["Alacakaranlık render", "Videoya çevir", "Kuş bakışı", "İçeriden bakış"];
  }
  if (intent === "plan") {
    return ["Bu plandan salon görseli", "İzometrik 3D", "Döşeli versiyon", "Videoya çevir"];
  }
  return ["Videoya çevir", "Renk paletini değiştir", "Daha yakın çekim", "Boş kabuk hali"];
}
