import { DopingPackage } from "@/types/payment";

export const DOPING_PACKAGES: DopingPackage[] = [
  {
    id: "on_planda",
    name: "Ön Planda Göster",
    price: 49,
    durationDays: 7,
    type: "featured",
    features: ["Aramada üst sıralar", "Renkli arka plan"],
  },
  {
    id: "acil",
    name: "Acil İlan",
    price: 29,
    durationDays: 1,
    type: "urgent",
    features: ["'Acil' rozeti", "Özel sıralama"],
  },
  {
    id: "renkli_cerceve",
    name: "Renkli Çerçeve",
    price: 19,
    durationDays: 7,
    type: "highlighted",
    features: ["Dikkat çekici kenarlık"],
  },
  {
    id: "galeri",
    name: "Galeri Highlight",
    price: 39,
    durationDays: 7,
    type: "gallery",
    features: ["Anasayfa galeride gösterim"],
  },
  {
    id: "bump",
    name: "Yenile",
    price: 15,
    durationDays: 0,
    type: "bump",
    features: ["İlanı en üste taşı"],
  },
];

export const getDopingPackageById = (id: string) => {
  return DOPING_PACKAGES.find((p) => p.id === id);
};
