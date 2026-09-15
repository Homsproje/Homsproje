export const SITE = {
  name: "Homs Proje",
  short: "HOMS",
  domain: "homsproje.com",
  url: "https://homsproje.com",
  email: "info@homsproje.com",
  city: "İstanbul",
  tagline: "Kaliteyle yükselen yaşamlar",
  description:
    "Müteahhitlerin ortak satış ofisi. Beklenti ve bütçe doğru okunur; Beşiktaş, Etiler, Vadistanbul, Göktürk ve Kemerburgaz’daki uygun projeler sunulur. Fiyat–performans netleşince beğenilen daire yerinde görülür.",
};

export const NAV = [
  { to: "/site", label: "Ana sayfa" },
  { to: "/bolgeler", label: "Bölgeler" },
  { to: "/portfoy", label: "Portföy" },
  { to: "/hizmetler", label: "Hizmetler" },
  { to: "/hakkimizda", label: "Hakkımızda" },
  { to: "/iletisim", label: "İletişim" },
] as const;

export const APP_NAV = [
  { to: "/app", label: "Panel" },
  { to: "/studio", label: "Sohbet" },
  { to: "/arsiv", label: "Drive" },
  { to: "/talepler", label: "Talepler" },
] as const;

export type RegionId = "besiktas" | "etiler" | "vadistanbul" | "gokturk" | "kemerburgaz";

export const ROOM_OPTIONS: Record<RegionId, string[]> = {
  besiktas: ["1+0", "1+1", "2+1", "2+2", "3+1", "3+2", "4+1"],
  etiler: ["1+1", "2+1", "2+2", "3+1", "3+2"],
  vadistanbul: ["2+1", "3+1", "4+1", "4+2"],
  gokturk: ["2+1", "3+1", "4+1", "4+2"],
  kemerburgaz: ["2+1", "3+1", "4+1", "4+2"],
};

export const ALL_ROOMS = ["1+0", "1+1", "2+1", "2+2", "3+1", "3+2", "4+1", "4+2"];

export const REGIONS: {
  id: RegionId;
  name: string;
  kicker: string;
  line: string;
  body: string;
  image: string;
  rooms: string[];
}[] = [
  {
    id: "besiktas",
    name: "Beşiktaş",
    kicker: "01",
    line: "Merkez, yürüme mesafesi",
    body: "Boğaz’a yakın, günlük hayatın içinde. Stüdyodan geniş aile planına: 1+0’dan 3+2 ve 4+1’e.",
    image: "/regions/besiktas.jpg",
    rooms: ROOM_OPTIONS.besiktas,
  },
  {
    id: "etiler",
    name: "Etiler",
    kicker: "02",
    line: "Butik, aile ritmi",
    body: "Sakin sokak, okul ve yeşil. 1+1’den 3+2’ye, uzun soluklu oturum için.",
    image: "/regions/etiler.jpg",
    rooms: ROOM_OPTIONS.etiler,
  },
  {
    id: "vadistanbul",
    name: "Vadistanbul",
    kicker: "03",
    line: "Yeni nesil yerleşim",
    body: "Konut ve sosyal alanın bir arada olduğu projeler. 2+1’den 4+2’ye.",
    image: "/regions/vadistanbul.jpg",
    rooms: ROOM_OPTIONS.vadistanbul,
  },
  {
    id: "gokturk",
    name: "Göktürk",
    kicker: "04",
    line: "Yeşil, villa dokusu",
    body: "Çam, bahçe, düşük yoğunluk. 2+1’den 4+2’ye, nefes alan yaşam.",
    image: "/regions/gokturk.jpg",
    rooms: ROOM_OPTIONS.gokturk,
  },
  {
    id: "kemerburgaz",
    name: "Kemerburgaz",
    kicker: "05",
    line: "Orman kenarı, yükselen",
    body: "Doğaya açık yeni konutlar. 2+1’den 4+2’ye, oturum ve yatırım birlikte düşünülür.",
    image: "/regions/kemerburgaz.jpg",
    rooms: ROOM_OPTIONS.kemerburgaz,
  },
];

export const STEPS = [
  {
    n: "01",
    t: "Beklenti analizi",
    d: "Nasıl yaşamak istediğiniz, bölge tercihi ve bütçe netleştirilir.",
  },
  {
    n: "02",
    t: "Uygun projeler",
    d: "Portföyden beklentiye ve bütçeye uyan daireler seçilir.",
  },
  {
    n: "03",
    t: "Fiyat–performans",
    d: "Seçilen projeler plan, konum ve bedel üzerinden birlikte değerlendirilir.",
  },
  {
    n: "04",
    t: "Yerinde inceleme",
    d: "Beğenilen daire yerinde görülür. Uygunsa süreç oradan ilerler.",
  },
];

export type Listing = {
  id: string;
  title: string;
  region: RegionId;
  rooms: string;
  area: string;
  status: string;
  image: string;
  body: string;
};

const AREA: Record<string, string> = {
  "1+0": "45 m²",
  "1+1": "72 m²",
  "2+1": "98 m²",
  "2+2": "118 m²",
  "3+1": "138 m²",
  "3+2": "168 m²",
  "4+1": "198 m²",
  "4+2": "228 m²",
};

const BLURB: Record<string, string> = {
  "1+0": "Tek yaşam alanı, stüdyo düzeni. Yatırım ve sade oturum için.",
  "1+1": "Ayrı yatak odası, açık salon. Tek kişi veya çift için dengeli plan.",
  "2+1": "İki oda, ortak yaşam. Aile başlangıcı veya ev ofis için.",
  "2+2": "İki oda, iki salon. Gündüz–gece ayrımı net planlar.",
  "3+1": "Üç oda, ortak salon. Aile oturumu için asıl tercih.",
  "3+2": "Üç oda, iki yaşam alanı. Geniş aile, misafir ve çalışma için.",
  "4+1": "Dört oda. Kalabalık hane veya ebeveyn katı arayanlar için.",
  "4+2": "Dört oda, iki salon. Villa hissi, geniş program.",
};

const PHOTOS = [
  "/samples/furnished-living.jpg",
  "/samples/furnished-kitchen.jpg",
  "/samples/empty-living.jpg",
  "/samples/exterior.jpg",
  "/samples/isometric.jpg",
];

function slug(region: RegionId, rooms: string) {
  return `${region}-${rooms.replaceAll("+", "plus")}`;
}

export const LISTINGS: Listing[] = REGIONS.flatMap((region, ri) =>
  region.rooms.map((rooms, i) => ({
    id: slug(region.id, rooms),
    title: `${region.name} ${rooms}`,
    region: region.id,
    rooms,
    area: AREA[rooms] ?? "",
    status: "Satılık",
    image: i === 0 ? region.image : PHOTOS[(ri + i) % PHOTOS.length],
    body: `${region.line}. ${BLURB[rooms] ?? ""}`,
  })),
);

export const SERVICES = [
  {
    kicker: "01",
    title: "Beklenti analizi",
    body: "Oda sayısı ve bölgeden önce nasıl yaşamak istediğiniz dinlenir. Bütçe bu resmin içine oturtulur.",
  },
  {
    kicker: "02",
    title: "Portföy eşleştirme",
    body: "Beşiktaş, Etiler, Vadistanbul, Göktürk ve Kemerburgaz’daki dairelerden size uyanlar seçilir.",
  },
  {
    kicker: "03",
    title: "Fiyat–performans",
    body: "Aday projeler konum, plan ve bedel üzerinden yan yana konur. Karar spekülasyona bırakılmaz.",
  },
  {
    kicker: "04",
    title: "Yerinde inceleme",
    body: "Beğenilen daire yerinde görülür. Uyuyorsa süreç tamamlanır; uymuyorsa liste daraltılır.",
  },
];
