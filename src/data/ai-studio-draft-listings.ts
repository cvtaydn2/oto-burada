export interface AiStudioDraftListing {
  id: string;
  title: string;
  brand: string;
  series: string;
  model: string;
  year: number;
  fuel: string;
  gear: string;
  km: number;
  color: string;
  price: number;
  currency: string;
  date: string;
  location: string;
  thumbnail: string;
  images: string[];
  seller: {
    memberSince: string;
    name: string;
    phone: string;
    rating?: number;
    type: "Dealer" | "Owner";
    verified: boolean;
  };
  description: string;
  marketStatus: "excellent" | "fair" | "high";
  priceDiff: number;
  tags: string[];
  listingQualityScore: number;
  isSuspicious?: boolean;
  insights: string[];
}

export const aiStudioDraftListings: AiStudioDraftListing[] = [
  {
    id: "1001",
    title: "SAHIBINDEN TEMIZ BOYASIZ HASARSIZ",
    brand: "Volkswagen",
    series: "Passat",
    model: "1.6 TDi BlueMotion Impression",
    year: 2020,
    fuel: "Diesel",
    gear: "Semi-Auto",
    km: 85000,
    color: "White",
    price: 1350000,
    currency: "TL",
    date: "04 April 2026",
    location: "Istanbul / Kadikoy",
    thumbnail: "https://picsum.photos/seed/passat1/640/420",
    images: [
      "https://picsum.photos/seed/passat1/800/600",
      "https://picsum.photos/seed/passat2/800/600",
    ],
    seller: {
      name: "Ahmet Yilmaz",
      type: "Owner",
      phone: "0532 111 22 33",
      memberSince: "2015",
      verified: true,
    },
    description:
      "Aracim cok temizdir, icinde sigara icilmemistir. Tum bakimlari yetkili serviste yapilmistir.",
    marketStatus: "excellent",
    priceDiff: -85000,
    tags: ["Boyasiz", "Tramersiz", "Dusuk KM"],
    listingQualityScore: 95,
    insights: [
      "Benzer ilanlarin %85'inden daha ucuz",
      "Kendi model yilina gore %20 daha az kullanilmis",
    ],
  },
  {
    id: "1002",
    title: "ACIL SATILIK HATASIZ DUSUK KM",
    brand: "Renault",
    series: "Megane",
    model: "1.5 dCi Touch",
    year: 2018,
    fuel: "Diesel",
    gear: "Manual",
    km: 112000,
    color: "Silver",
    price: 850000,
    currency: "TL",
    date: "03 April 2026",
    location: "Ankara / Cankaya",
    thumbnail: "https://picsum.photos/seed/megane1/640/420",
    images: ["https://picsum.photos/seed/megane1/800/600"],
    seller: {
      name: "Mehmet Demir",
      type: "Owner",
      phone: "0533 222 33 44",
      memberSince: "2018",
      verified: false,
    },
    description: "Ihtiyactan acil satilik. Ufak tefek cizikler var, boya degisen yok.",
    marketStatus: "fair",
    priceDiff: -5000,
    tags: ["Acil", "Masrafsiz"],
    listingQualityScore: 82,
    insights: ["Bolgedeki en cok aranan model", "Fiyati piyasa ortalamasinda"],
  },
  {
    id: "1003",
    title: "GALERIDEN 2023 MODEL SIFIR AYARINDA",
    brand: "Toyota",
    series: "Corolla",
    model: "1.5 Vision",
    year: 2023,
    fuel: "Gasoline",
    gear: "Automatic",
    km: 15000,
    color: "Black",
    price: 1250000,
    currency: "TL",
    date: "05 April 2026",
    location: "Izmir / Bornova",
    thumbnail: "https://picsum.photos/seed/corolla1/640/420",
    images: ["https://picsum.photos/seed/corolla1/800/600"],
    seller: {
      name: "Auto Center",
      type: "Dealer",
      phone: "0232 333 44 55",
      memberSince: "2010",
      verified: true,
      rating: 4.8,
    },
    description: "Sifir ayarinda, garantisi devam ediyor. Kredi kartina taksit imkani.",
    marketStatus: "fair",
    priceDiff: 15000,
    tags: ["Garantili", "Krediye Uygun"],
    listingQualityScore: 98,
    insights: ["Sifir arac kondisyonunda", "Kurumsal satici guvencesi"],
  },
  {
    id: "1004",
    title: "DOKTORDAN TERTEMIZ GARAJ ARABASI",
    brand: "Honda",
    series: "Civic",
    model: "1.6 i-VTEC Eco Elegance",
    year: 2021,
    fuel: "LPG & Gasoline",
    gear: "Automatic",
    km: 45000,
    color: "Blue",
    price: 1280000,
    currency: "TL",
    date: "02 April 2026",
    location: "Bursa / Nilufer",
    thumbnail: "https://picsum.photos/seed/civic1/640/420",
    images: ["https://picsum.photos/seed/civic1/800/600"],
    seller: {
      name: "Dr. Ali Veli",
      type: "Owner",
      phone: "0535 444 55 66",
      memberSince: "2020",
      verified: true,
    },
    description: "Sadece haftasonlari kullanildi. Kapali garajda muhafaza edildi.",
    marketStatus: "excellent",
    priceDiff: -60000,
    tags: ["Garaj Arabasi", "Yetkili Servis Bakimli"],
    listingQualityScore: 94,
    insights: ["Emsallerine gore 60.000 TL avantajli", "Yetkili servis gecmisi tam"],
  },
  {
    id: "1005",
    title: "PIYASANIN YARI FIYATINA ACIL",
    brand: "Ford",
    series: "Focus",
    model: "1.5 Ti-VCT Trend X",
    year: 2019,
    fuel: "Gasoline",
    gear: "Manual",
    km: 68000,
    color: "Red",
    price: 620000,
    currency: "TL",
    date: "01 April 2026",
    location: "Antalya / Muratpasa",
    thumbnail: "https://picsum.photos/seed/focus1/640/420",
    images: ["https://picsum.photos/seed/focus1/800/600"],
    seller: {
      name: "Ayse Kaya",
      type: "Owner",
      phone: "0542 555 66 77",
      memberSince: "2026",
      verified: false,
    },
    description: "Acil paraya sikistigim icin satiyorum. Kapora gonderen alir.",
    marketStatus: "excellent",
    priceDiff: -300000,
    tags: ["Ilk Sahibinden", "Tramersiz"],
    listingQualityScore: 35,
    isSuspicious: true,
    insights: [
      "Fiyat piyasa ortalamasinin supheli derecede altinda",
      "Satici hesabi cok yeni acilmis",
      "Aciklamada kapora talebi var",
    ],
  },
  {
    id: "1006",
    title: "FULL+FULL EN DOLU PAKET",
    brand: "Skoda",
    series: "Superb",
    model: "1.5 TSI Prestige",
    year: 2022,
    fuel: "Gasoline",
    gear: "Semi-Auto",
    km: 32000,
    color: "Grey",
    price: 1950000,
    currency: "TL",
    date: "05 April 2026",
    location: "Istanbul / Sisli",
    thumbnail: "https://picsum.photos/seed/superb1/640/420",
    images: ["https://picsum.photos/seed/superb1/800/600"],
    seller: {
      name: "Premium Motors",
      type: "Dealer",
      phone: "0212 666 77 88",
      memberSince: "2016",
      verified: true,
      rating: 4.9,
    },
    description: "Aracimizda cam tavan, deri koltuk, serit takip vs. her sey mevcuttur.",
    marketStatus: "high",
    priceDiff: 120000,
    tags: ["Ekspertiz Raporlu", "Cam Tavan"],
    listingQualityScore: 88,
    insights: ["Piyasa ortalamasinin %6 uzerinde", "Donanim seviyesi en yuksek paket"],
  },
];
