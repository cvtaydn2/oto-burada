export const appName = "OtoBurada";
export const appTagline = "Arabanı Kolayca Sat. Doğru Arabayı Hızlıca Bul.";

export const navigation = {
  home: "Ana Sayfa",
  listings: "İlanlar",
  about: "Hakkında",
  contact: "İletişim",
  support: "Destek",
  login: "Giriş Yap",
  register: "Kayıt Ol",
  dashboard: "Panel",
  admin: "Yönetim"
} as const;

export const listingDetail = {
  listingNo: "İLAN NO",
  updated: "GÜNCELLENDİ",
  featured: "ÖNE ÇIKAN İLAN",
  expertApproved: "EKSPERTİZ ONAYLI",
  officialPrice: "RESMİ SATIŞ FİYATI",
  modelYear: "Model Yılı",
  mileage: "Kilometre",
  fuelType: "Yakıt Tipi",
  transmission: "Vites Tipi",
  listingStatus: "İlan Durumu",
  seller: "Satıcı",
  verified: "ONAYLI",
  active: "AKTİF",
  current: "GÜNCEL",
  noInspection: "Yok",
  hasInspection: "Onaylı",
  noInspectionDesc: "Ekspertiz beyan edilmedi",
  hasInspectionDesc: "Resmi rapor mevcut",
  zeroTramer: "SIFIR",
  tramerDesc: "Hasar kaydı bulunmuyor",
  hasTramerDesc: "Hasar kaydı detayları",
  verifiedSeller: "Kimlik doğrulanmış",
  profileActive: "Profil yayında",
  about: "İLAN HAKKINDA",
  location: "Gerçek Konum",
  similarListings: "Sizin İçin Seçtiklerimiz",
  downloadPdf: "PDF RAPORU GÖRÜNTÜLE",
  bodyPaint: "Kaporta & Boya Durumu",
  expertReport: "Ekspertiz Raporu",
  marketAnalysis: "Piyasa Analizi",
  priceHistory: "Fiyat Değişim Trendi",
  trustSummary: "Kurumsal Güven & Durum Özeti",
  allListings: "TÜM İLANLARI",
  createAppointment: "RANDEVU OLUŞTUR",
  reportListing: "İLANİ ŞİKAYET ET",
  quickOffer: "Hızlı Teklif",
  makeOffer: "KENDİ TEKLİFİNİ YAP",
  securityProtocols: "GÜVENLİK PROTOKOLLERİ",
  securityTips: [
    "Aracı görmeden kapora göndermeyiniz.",
    "Resmi ekspertiz raporu talep ediniz.",
    "Ödemeyi güvenli noter kanalıyla yapınız."
  ]
} as const;

export const dashboard = {
  controlCenter: "Kontrol Merkezi",
  newListing: "Yeni İlan Başlat",
  summary: "Özet",
  myListings: "İlanlarım",
  messages: "Mesajlar",
  favorites: "Favoriler",
  settings: "Ayarlar",
  activeListings: "Aktif İlanlarım",
  pendingApproval: "Bekleyen Onay",
  favoriteRecords: "Favori Kaydı",
  systemCredits: "Sistem Kredisi",
  totalRecord: "toplam kayıt",
  awaitingReview: "Uzman incelemesinde",
  userInteraction: "Kullanıcı etkileşimi",
  creditsBalance: "Öne çıkarma bakiyen",
  recentListings: "Son Yayınlananlar",
  viewAll: "Tümünü Gör",
  performance: "Performans",
  views: "İzlenme",
  noListings: "Henüz İlanın Yok",
  firstListing: "İlk ilanını vererek satışa başlayabilirsin.",
  createNow: "Hemen İlan Ver",
  credits: "Pazaryeri Kredileri",
  creditsDescription: "İlanlarını öne çıkarmak için kullanabileceğin bakiyen.",
  balance: "Bakiyen",
  loadCredits: "Kredi Yükle",
  quickAccess: "Hızlı Erişim",
  bulkImport: "Toplu İlan Yükle",
  myFavorites: "Favori İlanlarım",
  profileSettings: "Profil Ayarları",
  inbox: "Mesaj Kutusu",
  emailVerified: "E-posta Doğrulandı",
  emailNotVerified: "E-posta Doğrulanmadı",
  limitedAccess: "Kısıtlı Erişim: E-posta Doğrulanmadı",
  verifyEmailDesc: "Pazaryerinde güvenliği sağlamak için ilan vermeden önce e-postanı doğrulaman gerekiyor. Bu işlem sadece 30 saniye sürer.",
  verifyNow: "Hemen Doğrula",
  accountSecure: "Hesap Güvenliği Aktif",
  unlimitedPosting: "Sınırsız ilan yayınlama ve işlem yetkisi tanımlandı.",
  verifiedMember: "DOĞRULANMIŞ ÜYE",
  allListingsCount: (total: number, approved: number) => 
    `Toplam ${total} ilandan ${approved} tanesi yayında.`
} as const;

export const marketplace = {
  allListings: "Tüm Satılık Araçlar",
  premiumDiscovery: "Premium Keşif",
  brands: "Markalar",
  cities: "Şehirler",
  model: "MODEL",
  package: "PAKET",
  district: "ÜSTÜN İLÇE",
  featuredListings: "Öne Çıkan İlanlar",
  latestListings: "Yeni İlanlar",
  viewAll: "Tümünü İncele",
  discoverAll: "Tüm İlanları Keşfet",
  noListings: "Henüz ilan bulunmuyor",
  firstListingDesc: "İlk ilanı sen vererek platformda yerini alabilirsin. Türkiye'nin en güvenilir pazarına hemen katıl!",
  postFirst: "Hemen İlan Ver",
  activeListings: "Şu an aktif ilan listeleniyor",
  filter: "Filtreleme",
  advancedFilter: "Gelişmiş Filtrele",
  sort: "Sırala",
  quickFilters: {
    all: "Tüm İlanlar",
    expert: "Ekspertizli",
    priceDrop: "Fiyatı Dışan",
    newest: "Yeni Eklenen"
  },
  sortOptions: {
    newest: "En Yeni",
    oldest: "En Eski",
    priceAsc: "Fiyat (Düşükten Yükseğe)",
    priceDesc: "Fiyat (Yüksekten Düşüğe)",
    mileageAsc: "Kilometre (Düşükten Yükseğe)",
    mileageDesc: "Kilometre (Yüksekten Düşüğe)",
    yearDesc: "Yıl (Yeniden Eskiye)",
    yearAsc: "Yıl (Eskiden Yeniye)"
  },
  activeFilters: "Aktif Süzgeçler",
  clearAll: "Temizle",
  showing: (total: number, shown: number) => 
    `Toplam ${total} ilan arasından ${shown} araç gösteriliyor`,
  showingSingle: (total: number) => `${total} ilan`,
  noResults: "Sonuç bulunamadı",
  noResultsDesc: "Aradığınız kriterlere uygun araç bulunamadı. Filtreleri değiştirip tekrar deneyin.",
  clearFilters: "Filtreleri Temizle",
  loadMore: "Daha Fazla Göster",
  allViewed: "Mevcut tüm ilanları görüntülediniz.",
  loadingMore: "Daha fazla yükleniyor...",
  brandListings: (brand: string) => `${brand} İlanları`,
  totalActive: "aktif"
} as const;

export const admin = {
  controlCenter: "Yönetim Merkezi",
  systemOnline: "Sistem: ONLINE",
  systemOffline: "Sistem: OFFLINE",
  dbHealth: "DB Sağlığı",
  serverLoad: "Sunucu Yükü",
  security: "Güvenlik",
  uptime: "Uptime",
  normal: "Normal",
  active: "Aktif",
  pendingListings: "Bekleyen İlanlar",
  moderationQueue: "Moderasyon kuyruğu",
  activeReports: "Aktif Şikayetler",
  userReports: "Kullanıcı ihbarları",
  totalListings: "Toplam İlan",
  inventorySize: "Envanter hacmi",
  weekly: "Haftalık",
  registeredMembers: "Kayıtlı Üye",
  ecosystemSize: "Ekosistem büyüklüğü",
  revenueVolume: "Ciro Hacmi",
  analytics: "Akış Analitiği",
  listingPerformance: "İlan yayın performans dağılımı",
  fullReport: "TAM RAPORU GÖR",
  recentActions: "Son İşlemler",
  noRecentActions: "Henüz işlem yok",
  system: "Sistem"
} as const;

export const breadcrumbs = {
  home: "Ana Sayfa",
  cars: "Otomobil"
} as const;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const common = {
  loading: "Yükleniyor...",
  error: "Bir hata oluştu",
  retry: "Tekrar Dene",
  cancel: "İptal",
  save: "Kaydet",
  delete: "Sil",
  edit: "Düzenle",
  confirm: "Onayla",
  back: "Geri",
  next: "İleri",
  submit: "Gönder",
  search: "Ara",
  filter: "Filtrele",
  sort: "Sırala",
  reset: "Sıfırla",
  apply: "Uygula",
  close: "Kapat",
  open: "Aç",
  seeMore: "Daha Fazla",
  viewDetails: "Detayları Gör",
  contact: "İletişime Geç",
  whatsapp: "WhatsApp",
  call: "Ara",
  share: "Paylaş",
  favorite: "Favori",
  unfavorite: "Favori Kaldır",
  report: "Bildir",
  approved: "Yayında",
  pending: "Onay Bekliyor",
  archived: "Arşivlendi",
  draft: "Taslak",
  rejected: "Reddedildi"
} as const;

export const auth = {
  login: "Giriş",
  loginTitle: "Hesabına giriş yap",
  loginSubmit: "Giriş Yap",
  register: "Kayıt Ol",
  registerTitle: "Ücretsiz ilan vermeye başla",
  registerSubmit: "Hesap Oluştur",
  logout: "Çıkış Yap",
  forgotPassword: "Şifremi Unuttum",
  resetPassword: "Şifre Sıfırla",
  noAccount: "Hesabın yok mu?",
  hasAccount: "Zaten hesabın var mı?"
} as const;

export const profile = {
  title: "Profil Ayarları",
  membership: "Üyelik Merkezi",
  accountInfo: "Hesap bilgilerinizi ve doğrulama durumunuzu yönetin.",
  completion: "Profil Tamamlandı",
  verification: "Doğrulama Durumu",
  emailVerification: "E-posta Onayı",
  identityVerification: "Kimlik Doğrulama",
  contactInfo: "İletişim Bilgileri",
  corporateStore: "Kurumsal Mağaza",
  corporateDesc: "Ticarî araç alım satımı için",
  personalInfo: "Kimlik Bilgileri",
  personalInfoDesc: "Bireysel bilgileriniz ilanlarınızda görünür.",
  emailRequired: "E-posta doğrulaması ilan yayınlamak için zorunludur."
} as const;

export const filters = {
  brand: "Marka",
  model: "Model",
  carTrim: "Paket",
  city: "Şehir",
  district: "İlçe",
  minPrice: "Min Fiyat",
  maxPrice: "Max Fiyat",
  minYear: "Min Yıl",
  maxYear: "Max Yıl",
  maxMileage: "Max Kilometre",
  maxTramer: "Max Tramer",
  fuelType: "Yakıt Tipi",
  transmission: "Vites Tipi",
  hasExpertReport: "Ekspertiz Raporu",
  query: "Arama"
} as const;

export const seller = {
  individual: "Bireysel Satıcı",
  corporate: "Kurumsal Galeri",
  memberSince: "Üyelik",
  satisfaction: "MEMNUNİYET",
  ratings: "DEĞERLENDİRME",
  gallery: "Galeri"
} as const;

export const trust = {
  // Labels
  professional: "Kurumsal Galeri",
  individual: "Bireysel",
  verifiedBusiness: "İŞLETME DOĞRULANDI",
  identityVerified: "KİMLİK DOĞRULANDI",
  verificationPending: "İNCELENİYOR",
  unverified: "DOĞRULAMA YOK",
  restricted: "KISITLI HESAP",
  
  // Restriction Messages (Seller facing)
  accountUnderReview: "Hesap İnceleme Altında",
  restrictionNotice: "Güvenlik incelemesi tamamlanana kadar ek güven sinyali gösterilmez.",
  dopingRestriction: "Güvenlik politikalarımız gereği, inceleme sürecindeki hesaplar premium özellikleri geçici olarak kullanamazlar.",
  
  // Contact Blocks (Buyer facing)
  contactBlocked: "Kısıtlı İletişim",
  contactBlockedDesc: "Bu satıcının iletişim seçenekleri hesap incelemesi nedeniyle geçici olarak kısıtlanmıştır.",
  
  // Detailed Feedback (Seller facing)
  verificationRejected: "Başvuru Reddedildi",
  verificationRejectedDesc: "İşletme bilgileriniz doğrulanamadı. Lütfen bilgileri kontrol edip tekrar başvurun.",
  verificationPendingDesc: "Bilgileriniz uzman ekibimiz tarafından inceleniyor. Bu süreçte bazı özellikler kısıtlanabilir.",
  accountRestrictedTitle: "Hesap İşlemlere Kısıtlandı",
  accountRestrictedDesc: "Güvenlik politikası ihlali nedeniyle hesabınız kısıtlanmıştır. Lütfen destek ile iletişime geçin."
} as const;