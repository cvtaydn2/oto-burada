import type { Profile } from "@/types";

interface SellerTrustSummary {
  badgeLabel: string;
  score: number;
  signals: string[];
}

export function calculateTrustScore(seller: Partial<Profile> | null): number {
  if (!seller) return 0;
  
  let score = 0;
  
  // Rule 1: E-posta doğrulandıysa +20 puan
  if (seller.emailVerified) {
    score += 20;
  }
  
  // Rule 2: Profil fotoğrafı eklendiyse +10 puan
  if (seller.avatarUrl && seller.avatarUrl.trim().length > 0) {
    score += 10;
  }
  
  // Rule 3: Cüzdan doğrulaması (İyzico) yapıldıysa +50 puan
  if (seller.isWalletVerified) {
    score += 50;
  }
  
  // Ekstra ufak güvenlik/gerçeklik sinyalleri (Opsiyonel ama iyi olur)
  // Gelecekte ek puan kriterleri buraya eklenebilir.
  
  return Math.min(score, 100);
}

export function getSellerTrustSummary(
  seller: Profile | null,
  activeListingCount: number,
): SellerTrustSummary {
  if (!seller) {
    return {
      badgeLabel: "Yeni Satıcı",
      score: 0,
      signals: [],
    };
  }

  const signals: string[] = [];
  
  // Eğer veritabanından çekilen bir trustScore varsa o kullanılabilir,
  // Yoksa runtime üzerinden güncel hesaplama yapılır.
  const score = seller.trustScore !== undefined && seller.trustScore > 0 
    ? seller.trustScore 
    : calculateTrustScore(seller);

  if (seller.emailVerified) {
    signals.push("E-posta onayı (Güven Puanı +20)");
  }

  if (seller.avatarUrl && seller.avatarUrl.trim().length > 0) {
    signals.push("Profil fotoğrafı (Güven Puanı +10)");
  }

  if (seller.isWalletVerified) {
    signals.push("İyzico Cüzdan Doğrulaması (Güven Puanı +50)");
  }

  let badgeLabel = "Standart Üye";
  if (score >= 80) badgeLabel = "Premium Doğrulanmış Satıcı";
  else if (score >= 50) badgeLabel = "Güvenilir Satıcı";
  else if (score >= 20) badgeLabel = "Onaylı E-posta";

  if (activeListingCount > 0) {
    signals.push(`${activeListingCount} aktif ilan`);
  }

  return {
    badgeLabel,
    score, // Score artık 0-100 arasında
    signals: signals.slice(0, 4),
  };
}
