export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  listingQuota: number;
  credits: number;
  features: string[];
  type: "individual" | "professional" | "corporate";
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "individual_free",
    name: "Bireysel (Standart)",
    price: 0,
    listingQuota: 3,
    credits: 0,
    type: "individual",
    features: [
      "3 aktif ilan hakkı",
      "Ücretsiz yayınlama",
      "Standart satıcı rozeti",
      "WhatsApp üzerinden iletişim",
    ],
  },
  {
    id: "pro_plan",
    name: "Pro Paket",
    price: 1490,
    listingQuota: 50,
    credits: 500,
    type: "professional",
    features: [
      "50 aktif ilan hakkı",
      "Ayda 5 ücretsiz doping kredisi",
      "Profesyonel satıcı rozeti",
      "Öncelikli destek",
      "Profil özelleştirme",
    ],
  },
  {
    id: "corporate_fleet",
    name: "Kurumsal Filo",
    price: 4990,
    listingQuota: 200,
    credits: 2000,
    type: "corporate",
    features: [
      "200 aktif ilan hakkı",
      "Sınırsız doping kullanımı",
      "Kurumsal rozet",
      "API erişimi",
      "Hesap yöneticisi",
      "Stok yönetim paneli",
    ],
  },
];
