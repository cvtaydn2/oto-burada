/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data Transfer Objects (DTOs) and Sanity Helpers
 * Used to ensure sensitive database fields (passwords, social security nos, internal notes) 
 * are NOT passed from Server Components to Client Components.
 */

import { Profile, Listing } from "@/types";

/**
 * Strips sensitive data from a profile object for public or dashboard display.
 */
export function toProfileDTO(profile: any | null | undefined): Partial<Profile> {
  if (!profile) return {};
  
  // Map both camelCase and snake_case database fields
  return {
    id: profile.id,
    fullName: profile.fullName || profile.full_name,
    avatarUrl: profile.avatarUrl || profile.avatar_url,
    city: profile.city,
    role: profile.role,
    userType: profile.userType || profile.user_type,
    isVerified: profile.isVerified || profile.is_verified,
    businessName: profile.businessName || profile.business_name,
    businessLogoUrl: profile.businessLogoUrl || profile.business_logo_url,
    businessSlug: profile.businessSlug || profile.business_slug,
    createdAt: profile.createdAt || profile.created_at,
  };
}

/**
 * Strips internal fields from a listing object.
 * Note: license_plate and vin should be masked for general public.
 */
export function toListingDTO(listing: any | null | undefined, options: { 
  isOwner?: boolean; 
  isAdmin?: boolean;
} = {}): Partial<Listing> {
  if (!listing) return {};

  const dto: any = { ...listing };

  // ── PILL: Issue 6 - Mask sensitive vehicle identifiers for non-authorized users ─────
  if (!options.isOwner && !options.isAdmin) {
    if (dto.license_plate) {
      dto.license_plate = maskLicensePlate(dto.license_plate);
    }
    if (dto.vin) {
      dto.vin = maskVin(dto.vin);
    }
  }

  // Remove internal/system fields that shouldn't be in RSC payload if not needed
  // delete dto.internal_notes;
  // delete dto.fraud_metadata;

  return dto;
}

function maskLicensePlate(plate: string): string {
  if (!plate || plate.length < 4) return plate;
  // Example: 34ABC123 -> 34 ABC ***
  const parts = plate.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `${parts[0]} ${parts[1]} ***`;
  }
  return plate.substring(0, 5) + "***";
}

function maskVin(vin: string): string {
  if (!vin || vin.length < 8) return vin;
  // Example: ABC123456789 -> ABC123*******
  return vin.substring(0, 6) + "*******";
}
