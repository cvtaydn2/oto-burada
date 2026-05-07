import { DopingPackage, DopingType } from "@/types/payment";

export const DOPING_PACKAGES: DopingPackage[] = [
  {
    id: "kucuk_fotograf",
    name: "Küçük Fotoğraf",
    price: 3900,
    durationDays: 7,
    type: "small_photo",
    summary: "Liste görünümünde fotoğrafınızı daha dikkat çekici gösterir.",
    features: ["Liste görünümünde fotoğrafı öne çıkar", "Daha güçlü ilk izlenim", "7 gün aktif"],
    surfaces: ["Liste sonuçlarında fotoğraf alanı", "Kart görünümü ilk bakış alanı"],
  },
  {
    id: "acil_acil",
    name: "Acil Acil",
    price: 18200,
    durationDays: 7,
    type: "urgent",
    summary: "İlanınıza acil rozeti ekler ve hızlı satılık sinyali verir.",
    features: ['"Acil" rozeti', "Acil ilan vurgusu", "7 gün boyunca aktif"],
    surfaces: ["İlan kartı rozet alanı", "Detay sayfası üst bilgi alanı"],
  },
  {
    id: "anasayfa_vitrini",
    name: "Anasayfa Vitrini",
    price: 76000,
    durationDays: 7,
    type: "homepage_showcase",
    summary: "İlanınızı anasayfadaki premium vitrin alanına taşır.",
    features: ["Anasayfa vitrin alanında görünür", "En yüksek görünürlük", "7 gün aktif"],
    surfaces: ["Anasayfa vitrin alanı", "Premium vitrin kartları", "Öne çıkan görünürlük"],
  },
  {
    id: "kategori_vitrini",
    name: "Kategori Vitrini",
    price: 23000,
    durationDays: 7,
    type: "category_showcase",
    summary: "İlgili kategori veya keşif yüzeyinde daha görünür olur.",
    features: ["Seçili araç kategorisinde öne çıkar", "İlgili alıcıya daha görünür", "7 gün aktif"],
    surfaces: ["Kategori vitrin alanı", "Keşif yüzeyleri"],
  },
  {
    id: "ust_siradayim",
    name: "Üst Sıradayım",
    price: 66000,
    durationDays: 7,
    type: "top_rank",
    summary: "Arama ve liste sonuçlarında üst sıralarda görünürlük önceliği sağlar.",
    features: [
      "Arama sonuçlarında üst sıra önceliği",
      "Liste görünürlüğünü artırır",
      "7 gün aktif",
    ],
    surfaces: ["Listeleme sonuç sırası", "Arama sonuçları"],
  },
  {
    id: "detayli_arama_vitrini",
    name: "Detaylı Arama Vitrini",
    price: 9000,
    durationDays: 7,
    type: "detailed_search_showcase",
    summary: "Detaylı filtreleme yapan yüksek niyetli alıcılara daha görünür olur.",
    features: ["Detaylı filtre sonuçlarında öne çıkar", "Niyetli alıcıya görünür", "7 gün aktif"],
    surfaces: ["Detaylı filtre sonuçları", "İleri arama yüzeyleri"],
  },
  {
    id: "kalin_yazi_renkli_cerceve",
    name: "Kalın Yazı & Renkli Çerçeve",
    price: 6100,
    durationDays: 7,
    type: "bold_frame",
    summary: "Kart ve liste görünümünde ilanınızı görsel olarak daha belirgin yapar.",
    features: ["Kalın başlık", "Renkli çerçeve", "7 gün boyunca dikkat çeker"],
    surfaces: ["Liste kart çerçevesi", "Kart başlık vurgusu"],
  },
  {
    id: "guncelim",
    name: "Güncelim",
    price: 8800,
    durationDays: 0,
    type: "bump",
    summary: "İlanı yeniden güncel göstererek taze içerik olarak öne iter.",
    features: [
      "İlan tarihini günceller",
      "Tek kullanım",
      "Aynı ilan için 24 saat sonra tekrar alınabilir",
    ],
    surfaces: ["Varsayılan sıralama", "Yeni/güncel ilan akışı"],
  },
];

export const DOPING_TYPE_LABELS: Record<DopingType, string> = {
  small_photo: "Küçük Fotoğraf",
  urgent: "Acil Acil",
  homepage_showcase: "Anasayfa Vitrini",
  category_showcase: "Kategori Vitrini",
  top_rank: "Üst Sıradayım",
  detailed_search_showcase: "Detaylı Arama Vitrini",
  bold_frame: "Kalın Yazı & Renkli Çerçeve",
  bump: "Güncelim",
};

export const getDopingPackageById = (id: string) => {
  return DOPING_PACKAGES.find((p) => p.id === id);
};

export const getDopingPackageByType = (type: DopingType) => {
  return DOPING_PACKAGES.find((p) => p.type === type);
};
