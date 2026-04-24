import { DopingPackage } from "@/types/payment";

export const DOPING_PACKAGES: DopingPackage[] = [
  {
    id: "on_planda",
    name: "Ön Planda Göster",
    price: 49,
    durationDays: 7,
    type: "featured",
    features: ["Aramada üst sıralar", "Renkli arka plan", "7 gün boyunca öne çıkar"],
  },
  {
    id: "acil",
    name: "Acil İlan",
    price: 29,
    durationDays: 1,
    type: "urgent",
    features: ['"Acil" rozeti', "Özel sıralama", "24 saat boyunca acil etiketiyle gösterilir"],
  },
  {
    id: "renkli_cerceve",
    name: "Renkli Çerçeve",
    price: 19,
    durationDays: 7,
    type: "highlighted",
    features: ["Dikkat çekici kenarlık", "Turuncu çerçeve ile öne çıkar", "7 gün boyunca aktif"],
  },
  {
    id: "galeri",
    name: "Galeri Highlight",
    price: 39,
    durationDays: 7,
    type: "gallery",
    features: [
      "Anasayfa galeride gösterim",
      "Carousel'de öne çıkar",
      "7 gün boyunca vitrin alanında",
    ],
  },
  {
    id: "bump",
    name: "Yenile (Bump)",
    price: 15,
    durationDays: 0,
    type: "bump",
    features: ["İlanı en üste taşı", "Yayın tarihini günceller", "Anında etki"],
  },
];

export const getDopingPackageById = (id: string) => {
  return DOPING_PACKAGES.find((p) => p.id === id);
};
