import { describe, it, expect } from 'vitest';
import { getSellerTrustSummary } from '../profile-trust';
import { Profile } from '@/types';

describe('profile-trust logic', () => {
  const mockProfile: Profile = {
    id: 'user-1',
    fullName: 'Cevat Aydın',
    phone: '905551112233',
    city: 'İstanbul',
    emailVerified: false,
    isVerified: false,
    role: 'user',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-01-01T00:00:00Z',
  };

  it('should return default summary if seller is null', () => {
    const result = getSellerTrustSummary(null, 0);
    expect(result.score).toBe(0);
    expect(result.signals).toHaveLength(0);
    expect(result.badgeLabel).toBe("Yeni Satıcı");
  });

  it('should calculate base score for new profile correctly', () => {
    // New profile with no verified traits = 0 score
    const result = getSellerTrustSummary(mockProfile, 0);
    expect(result.score).toBe(0);
    expect(result.signals).not.toContain('E-posta onayı');
    expect(result.badgeLabel).toBe("Standart Üye");
  });


  it('should boost score for verified email (20 pts) and label correctly', () => {
    const result = getSellerTrustSummary({ ...mockProfile, emailVerified: true }, 0);
    expect(result.badgeLabel).toBe('Onaylı E-posta');
    expect(result.score).toBe(20);
    expect(result.signals).toContain('E-posta onayı (Güven Puanı +20)');
  });

  it('should boost score for Iyzico wallet verified (50 pts) and label correctly', () => {
    const result = getSellerTrustSummary({ ...mockProfile, isWalletVerified: true }, 0);
    expect(result.badgeLabel).toBe('Güvenilir Satıcı');
    expect(result.score).toBe(50);
    expect(result.signals).toContain('İyzico Cüzdan Doğrulaması (Güven Puanı +50)');
  });

  it('should max out trust score across combinations and become Premium', () => {
    const result = getSellerTrustSummary({ 
      ...mockProfile, 
      isWalletVerified: true, 
      emailVerified: true, 
      avatarUrl: 'https://example.com/avatar.jpg' 
    }, 0);
    expect(result.badgeLabel).toBe('Premium Doğrulanmış Satıcı');
    expect(result.score).toBe(80);
    expect(result.signals).toContain('Profil fotoğrafı (Güven Puanı +10)');
  });

  it('should reflect active listing count in signals', () => {
    const countSummary = getSellerTrustSummary(mockProfile, 10);
    expect(countSummary.signals).toContain('10 aktif ilan');
  });
});
