/**
 * Data Transfer Objects (DTOs) and Sanity Helpers
 * Used to ensure sensitive database fields (passwords, social security nos, internal notes)
 * are NOT passed from Server Components to Client Components.
 */

import { Profile, Listing } from "@/types";

type RawProfile = {
  id?: string;
  fullName?: string | null;
  full_name?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  role?: Profile["role"];
  userType?: Profile["userType"];
  user_type?: Profile["userType"];
  isVerified?: boolean | null;
  is_verified?: boolean | null;
  businessName?: string | null;
  business_name?: string | null;
  businessLogoUrl?: string | null;
  business_logo_url?: string | null;
  businessSlug?: string | null;
  business_slug?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

/**
 * Strips sensitive data from a profile object for public or dashboard display.
 */
export function toProfileDTO(profile: RawProfile | null | undefined): Partial<Profile> {
  if (!profile) return {};

  return {
    id: profile.id,
    fullName: profile.fullName ?? profile.full_name ?? undefined,
    avatarUrl: profile.avatarUrl ?? profile.avatar_url ?? undefined,
    city: profile.city ?? undefined,
    role: profile.role,
    userType: profile.userType ?? profile.user_type,
    isVerified: profile.isVerified ?? profile.is_verified ?? undefined,
    businessName: profile.businessName ?? profile.business_name ?? undefined,
    businessLogoUrl: profile.businessLogoUrl ?? profile.business_logo_url ?? undefined,
    businessSlug: profile.businessSlug ?? profile.business_slug ?? undefined,
    createdAt: profile.createdAt ?? profile.created_at ?? undefined,
  };
}

type RawListing = Partial<Listing> & {
  license_plate?: string | null;
  vin?: string | null;
};

/**
 * Strips internal fields from a listing object.
 * license_plate ve VIN yetkisiz kullanıcılar için maskelenir.
 */
export function toListingDTO(listing: RawListing | null | undefined, options: {
  isOwner?: boolean;
  isAdmin?: boolean;
} = {}): Partial<Listing> {
  if (!listing) return {};

  const dto: RawListing = { ...listing };

  if (!options.isOwner && !options.isAdmin) {
    if (dto.license_plate) {
      dto.license_plate = maskLicensePlate(dto.license_plate);
    }
    if (dto.vin) {
      dto.vin = maskVin(dto.vin);
    }
  }

  return dto;
}

/**
 * Türkiye plaka formatlarını maskeler.
 * Desteklenen formatlar:
 *   "34 ABC 123"  → "34 ABC ***"
 *   "34ABC123"    → "34 ABC ***"
 *   "06A1234"     → "06 A ****"
 * Tanınmayan format: son 3 karakter maskelenir.
 */
export function maskLicensePlate(plate: string): string {
  if (!plate) return "";
  const clean = plate.trim().toUpperCase().replace(/\s+/g, "");

  // Format: 2 rakam + 1-3 harf + 2-4 rakam (örn: 34ABC123, 06A1234)
  const match = clean.match(/^(\d{2})([A-Z]{1,3})(\d{2,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${"*".repeat(match[3].length)}`;
  }

  // Tanınmayan format — son 3 karakteri maskele
  if (clean.length > 3) {
    return clean.slice(0, -3) + "***";
  }
  return "***";
}

/**
 * VIN numarasını maskeler.
 * İlk 8 karakter (WMI + VDS başlangıcı) görünür, geri kalanı maskelenir.
 * Örn: WBA3A5C5XDF354762 → WBA3A5C5*********
 */
export function maskVin(vin: string): string {
  if (!vin) return "";
  const clean = vin.trim().toUpperCase();
  if (clean.length < 8) return "*".repeat(clean.length);
  // İlk 8 karakter görünür (üretici + model bilgisi), geri kalanı maskelenir
  return clean.slice(0, 8) + "*".repeat(clean.length - 8);
}
