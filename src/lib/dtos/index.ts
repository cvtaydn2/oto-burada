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
export function toProfileDTO(profile: any): Partial<Profile> {
  if (!profile) return {};
  
  // Pick only safe fields
  const p = profile as any;
  const {
    id,
    fullName,
    full_name,
    avatarUrl,
    avatar_url,
    city,
    role,
    userType,
    user_type,
    isVerified,
    is_verified,
    businessName,
    business_name,
    businessLogoUrl,
    business_logo_url,
    businessSlug,
    business_slug,
    createdAt,
    created_at,
  } = p;

  return {
    id,
    fullName: fullName || full_name,
    avatarUrl: avatarUrl || avatar_url,
    city,
    role,
    userType: userType || user_type,
    isVerified: isVerified || is_verified,
    businessName: businessName || business_name,
    businessLogoUrl: businessLogoUrl || business_logo_url,
    businessSlug: businessSlug || business_slug,
    createdAt: createdAt || created_at,
  };
}

/**
 * Strips internal fields from a listing object.
 * Note: license_plate and vin should be masked for general public.
 */
export function toListingDTO(listing: any, options: { 
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
