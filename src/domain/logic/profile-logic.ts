import { getMembershipYears, getMemberSinceYear } from "@/lib/listings/utils";

/**
 * Domain logic for Profile/Seller entities.
 */

export function getProfileMembershipLabel(createdAt: string | null): string | null {
  const memberSince = getMemberSinceYear(createdAt);
  const membershipYears = getMembershipYears(memberSince);

  if (membershipYears === null) return null;
  if (membershipYears === 0) return "Yeni Üye";
  if (membershipYears === 1) return "1 Yıldır Üye";
  return `${membershipYears} Yıldır Üye`;
}

export function getProfileInitials(name: string | null): string {
  if (!name) return "?";
  return name[0].toUpperCase();
}
