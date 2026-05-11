import {
  CarFront,
  Check,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";

export interface PricingFeature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export const FREE_FEATURES: PricingFeature[] = [
  {
    icon: <CarFront size={24} />,
    title: "Bireysel Ücretsiz İlan",
    desc: "Bireysel kullanıcılar için hızlı ve ücretsiz araç ilanı oluşturma",
  },
  {
    icon: <Check size={24} />,
    title: "Moderasyondan Geçer",
    desc: "Güvenlik için tüm ilanlar kontrol edilir",
  },
  {
    icon: <MessageCircle size={24} />,
    title: "Doğrudan WhatsApp",
    desc: "Satıcılarla anında iletişime geçin",
  },
  {
    icon: <Star size={24} />,
    title: "Temel Galeri",
    desc: "İlana en fazla 20 fotoğraf ekleyin",
  },
  {
    icon: <MapPin size={24} />,
    title: "Konum Belirtme",
    desc: "Şehir ve ilçe bilgisi ile bulunabilirlik",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Rapor Kontrolü",
    desc: "Ekspertiz ve trafik sigortası raporu takibi",
  },
];

export const CORPORATE_PLANS = [
  {
    name: "Küçük Galeri",
    price: 1499,
    period: "ay",
    icon: <Users size={32} />,
    features: [
      { text: "10 Aktif Araç İlanı", included: true },
      { text: "Temel galeri vitrini", included: true },
      { text: "WhatsApp yönlendirme desteği", included: true },
      { text: "Aylık performans özeti", included: true },
      { text: "Öncelikli destek", included: false },
      { text: "Kurumsal profil görünümü", included: false },
    ],
  },
  {
    name: "Orta Galeri",
    price: 3499,
    period: "ay",
    icon: <TrendingUp size={32} />,
    popular: true,
    features: [
      { text: "30 Aktif Araç İlanı", included: true },
      { text: "Gelişmiş galeri vitrini", included: true },
      { text: "WhatsApp yönlendirme desteği", included: true },
      { text: "Aylık performans özeti", included: true },
      { text: "Öncelikli destek", included: true },
      { text: "Kurumsal profil görünümü", included: true },
    ],
  },
  {
    name: "Büyük Galeri",
    price: 9999,
    period: "ay",
    icon: <Star size={32} />,
    features: [
      { text: "Sınırsız Aktif Araç İlanı", included: true },
      { text: "Premium galeri vitrini", included: true },
      { text: "WhatsApp yönlendirme desteği", included: true },
      { text: "Haftalık performans özeti", included: true },
      { text: "Öncelikli destek", included: true },
      { text: "Kurumsal marka görünümü", included: true },
    ],
  },
];

export const ADDITIONAL_FEATURES = [
  {
    icon: <TrendingUp size={40} />,
    title: "Hızlı Satış",
    desc: "Doping paketleri ilanınızı daha görünür hale getirir ve daha fazla alıcıya daha hızlı ulaşmanıza yardımcı olur.",
  },
  {
    icon: <TrendingUp size={40} />,
    title: "Daha Görünürlük",
    desc: "Vitrinde öne çıkın ve arama sonuçlarında daha görünür olun. Doğru alıcıya daha kısa sürede ulaşın.",
  },
  {
    icon: <Users size={40} />,
    title: "Kurumsal Güven",
    desc: "Kurumsal galeri paketleri ile araç stoğunuzu daha düzenli sunun ve marka güvenini güçlendirin.",
  },
  {
    icon: <MessageCircle size={40} />,
    title: "Doğrudan İletişim",
    desc: "Potansiyel alıcılarla WhatsApp üzerinden hızlı bağlantı kurun ve iletişim sürtünmesini azaltın.",
  },
];

export interface PremiumService {
  icon: React.ReactNode;
  title: string;
  desc: string;
  optional: boolean;
}

export const PREMIUM_SERVICES: PremiumService[] = [
  {
    icon: <ShieldCheck size={28} />,
    title: "Ekspertiz Randevusu",
    desc: "Yetkili servislerde araç kontrolü ve raporu için kolay randevu alın.",
    optional: true,
  },
  {
    icon: <CarFront size={28} />,
    title: "Araç Geçmişi Raporu",
    desc: "Araç geçmişi, sigorta ve bakım kayıtları için opsiyonel rapor hizmeti.",
    optional: true,
  },
  {
    icon: <Star size={28} />,
    title: "AI Destekli İlan Açıklaması",
    desc: "AI yardımıyla etkili ilan başlığı ve açıklama üretin.",
    optional: true,
  },
];
