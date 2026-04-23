import { BuyerInfo } from "@/lib/payment/types";
import { Profile } from "@/types";

/**
 * Maps a profile to Iyzico BuyerInfo.
 * Throws an error if required fields are missing.
 */
export function getIyzicoBuyerFromProfile(profile: Profile, email: string, ip: string): BuyerInfo {
  const address = profile.businessAddress?.trim() || null;
  const city = profile.city?.trim() || null;
  const zipCode = address?.match(/\b\d{5}\b/)?.[0] ?? null;
  const gsmNumber = profile.phone?.trim() || null;
  const identityNumber = profile.taxId && /^\d{11}$/.test(profile.taxId) ? profile.taxId : null;

  if (!gsmNumber || !address || !city || !zipCode || !identityNumber) {
    throw new Error(
      "Missing required profile fields for payment (phone, address, city, zip, identity)"
    );
  }

  const nameParts = profile.fullName.trim().split(" ");
  const name = nameParts[0];
  const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  if (!name || !surname) {
    throw new Error("Profile fullName must contain both name and surname for payment");
  }

  return {
    id: profile.id,
    name,
    surname,
    email,
    identityNumber,
    gsmNumber,
    address,
    city,
    country: "Turkey",
    zipCode,
    ip,
    registrationDate: new Date(profile.createdAt).toISOString().slice(0, 19).replace("T", " "),
    lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
  };
}
