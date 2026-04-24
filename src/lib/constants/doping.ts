import { DopingPackage } from "@/types/payment";

export const DOPING_PACKAGES: DopingPackage[] = [
  {
    id: "kucuk_fotograf",
    name: "Küçük Fotoğraf",
    price: 39,
    durationDays: 7,
    type: "small_photo",
    features: ["Liste görünümünde fotoğrafı öne çıkar", "Daha güçlü ilk izlenim", "7 gün aktif"],
  },
  {
    id: "acil_acil",
    name: "Acil Acil",
    price: 182,
    durationDays: 7,
    type: "urgent",
    features: ['"Acil" rozeti', "Acil ilan vurgusu", "7 gün boyunca aktif"],
  },
  {
    id: "anasayfa_vitrini",
    name: "Anasayfa Vitrini",
    price: 760,
    durationDays: 7,
    type: "homepage_showcase",
    features: ["Anasayfa vitrin alanında görünür", "En yüksek görünürlük", "7 gün aktif"],
  },
  {
    id: "kategori_vitrini",
    name: "Kategori Vitrini",
    price: 230,
    durationDays: 7,
    type: "category_showcase",
    features: ["Seçili araç kategorisinde öne çıkar", "İlgili alıcıya daha görünür", "7 gün aktif"],
  },
  {
    id: "ust_siradayim",
    name: "Üst Sıradayım",
    price: 660,
    durationDays: 7,
    type: "top_rank",
    features: [
      "Arama sonuçlarında üst sıra önceliği",
      "Liste görünürlüğünü artırır",
      "7 gün aktif",
    ],
  },
  {
    id: "detayli_arama_vitrini",
    name: "Detaylı Arama Vitrini",
    price: 90,
    durationDays: 7,
    type: "detailed_search_showcase",
    features: ["Detaylı filtre sonuçlarında öne çıkar", "Niyetli alıcıya görünür", "7 gün aktif"],
  },
  {
    id: "kalin_yazi_renkli_cerceve",
    name: "Kalın Yazı & Renkli Çerçeve",
    price: 61,
    durationDays: 7,
    type: "bold_frame",
    features: ["Kalın başlık", "Renkli çerçeve", "7 gün boyunca dikkat çeker"],
  },
  {
    id: "guncelim",
    name: "Güncelim",
    price: 88,
    durationDays: 0,
    type: "bump",
    features: [
      "İlan tarihini günceller",
      "Tek kullanım",
      "Aynı ilan için 24 saat sonra tekrar alınabilir",
    ],
  },
];

export const getDopingPackageById = (id: string) => {
  return DOPING_PACKAGES.find((p) => p.id === id);
};
