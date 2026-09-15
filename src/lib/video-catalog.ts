export const VIDEO_CATALOG = [
  {
    id: "angle",
    label: "Açı",
    hints: ["Aynı kadraj", "Yavaş dolly içeri", "Gimbal tur", "Pan pencereye", "Pan mutfağa", "Alçak geçiş", "Yüksek bakış", "Sabit tripod"],
  },
  {
    id: "style",
    label: "Tarz",
    hints: ["Sinematik yavaş", "Listing turu", "Reels tempo", "Lüks otel", "Sakin nefes", "Hızlı kesit yok"],
  },
  {
    id: "concept",
    label: "Konsept",
    hints: ["Gündüz yaşam", "Akşam ambiyans", "Golden hour", "Satış ofisi turu", "Tek oda hikâyesi"],
  },
  {
    id: "size",
    label: "Boyut",
    hints: ["9:16 dikey", "16:9 yatay", "1:1 kare"],
  },
  {
    id: "audio",
    label: "Ses",
    hints: ["Sessiz", "Hafif ambiyans", "Yumuşak piyano", "Şehir uzak"],
  },
  {
    id: "color",
    label: "Renk",
    hints: ["Sıcak ton", "Nötr doğal", "Film grain yok", "Doymayı yükseltme"],
  },
  {
    id: "light",
    label: "Işık",
    hints: ["Pencere ışığı kalsın", "Akşam sıcak", "LED tavan sabit", "Gölge doğal"],
  },
  {
    id: "intro",
    label: "Giriş",
    hints: ["Kapıdan giriş", "Pencereden başla", "Oturma grubundan", "Mutfaktan başla", "Yavaş fade"],
  },
  {
    id: "forbid",
    label: "Yapma",
    hints: [
      "Orijinal odaya sadık kal",
      "Odaları birleştirme",
      "Yeni koridor açma",
      "Balkon uydurma",
      "İki açıyı birleştirme",
      "Oda şeklini değiştirme",
      "Duvar silme",
      "Kamerayı odadan çıkarma",
    ],
  },
] as const;

export type VideoCatalogId = (typeof VIDEO_CATALOG)[number]["id"];
