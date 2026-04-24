import type { UserRole, VerificationStatus } from "./domain";

export interface ProfileBase {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  avatarUrl?: string | null;
  role: UserRole;
  userType?: "individual" | "professional" | "staff";
  createdAt: string;
  updatedAt: string;
}

export interface ProfileTrustInfo {
  isVerified: boolean;
  emailVerified: boolean;
  isBanned?: boolean;
  banReason?: string | null;
  restrictionState?: "active" | "restricted_review" | "banned";
  trustScore?: number;
  isWalletVerified?: boolean;
}

export interface ProfileVerificationWorkflow {
  verificationStatus?: VerificationStatus;
  verificationRequestedAt?: string | null;
  verificationReviewedAt?: string | null;
  verificationFeedback?: string | null;
}

export interface ProfileCorporateInfo {
  businessName?: string | null;
  businessAddress?: string | null;
  businessLogoUrl?: string | null;
  businessDescription?: string | null;
  taxId?: string | null;
  taxOffice?: string | null;
  websiteUrl?: string | null;
  verifiedBusiness?: boolean;
  businessSlug?: string | null;
}

export interface Profile
  extends ProfileBase, ProfileTrustInfo, ProfileVerificationWorkflow, ProfileCorporateInfo {
  balanceCredits?: number;
  identityNumber?: string | null;
}

export interface BusinessProfile extends Profile {
  userType: "professional";
  businessName: string;
}
