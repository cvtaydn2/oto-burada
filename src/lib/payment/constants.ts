export const DOPING_PRICES = {
  featured: {
    id: "featured",
    name: "Ana Sayfa Vitrin",
    price: 199,
    days: 7,
  },
  urgent: {
    id: "urgent",
    name: "Acil Acil",
    price: 99,
    days: 7,
  },
  highlighted: {
    id: "highlighted",
    name: "Kalın Yazı & Renkli Çerçeve",
    price: 49,
    days: 15,
  },
} as const;

export type DopingId = keyof typeof DOPING_PRICES;
