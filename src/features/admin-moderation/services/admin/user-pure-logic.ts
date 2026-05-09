import { decryptIdentityNumber, maskIdentityNumber } from "@/lib/identity-number";

export interface UserPaymentRecord {
  id: string;
  amount: number;
  provider: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserDopingRecord {
  listingId: string;
  listingTitle: string;
  dopingTypes: string[];
  appliedAt: string;
  featuredUntil: string | null;
  urgentUntil: string | null;
  highlightedUntil: string | null;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  avatarUrl: string | null;
  role: string;
  userType: string;
  balanceCredits: number;
  isVerified: boolean;
  isBanned: boolean;
  banReason?: string | null;
  businessName?: string;
  businessSlug?: string;
  verifiedBusiness?: boolean;
  email: string;
  createdAt: string;
  updatedAt: string;
  trustScore: number;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  emailVerified: boolean;
  identityNumber?: string | null;
}

export interface UserDetailData {
  profile: UserProfile;
  payments: UserPaymentRecord[];
  dopings: UserDopingRecord[];
  listings: {
    id: string;
    slug: string;
    title: string;
    brand: string;
    model: string;
    status: string;
  }[];
  creditTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }[];
  dopingHistory: {
    id: string;
    listingId: string;
    listingTitle: string;
    dopingType: string;
    expiresAt: string;
    createdAt: string;
  }[];
  listingCount: number;
  activeListingCount: number;
}

/**
 * Maps profile DB record to application interface
 */
export function mapProfile(p: Record<string, unknown>, email = ""): UserProfile {
  const decryptedIdentity = decryptIdentityNumber((p.identity_number as string | null) ?? null);
  return {
    id: p.id as string,
    email,
    fullName: (p.full_name as string) || "",
    phone: (p.phone as string) || "",
    city: (p.city as string) || "",
    avatarUrl: p.avatar_url as string,
    role: (p.role as string) || "user",
    userType: (p.user_type as string) || "individual",
    balanceCredits: (p.balance_credits as number) || 0,
    isVerified: (p.is_verified as boolean) || false,
    isBanned: (p.is_banned as boolean) || false,
    banReason: (p.ban_reason as string | null) ?? null,
    businessName: p.business_name as string,
    businessSlug: p.business_slug as string,
    createdAt: p.created_at as string,
    updatedAt: p.updated_at as string,
    trustScore: (p.trust_score as number) || 0,
    verificationStatus: (p.verification_status as UserProfile["verificationStatus"]) || "none",
    emailVerified: (p.email_verified as boolean) || false,
    identityNumber: maskIdentityNumber(decryptedIdentity),
  };
}

/**
 * Sanitizes and escapes incoming text searches to prevent SQL injection risks or formatting issues
 */
export function sanitizeUserSearchQuery(query?: string): string {
  if (!query) return "";
  return query
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .replace(/[%_]/g, "\\$&");
}

export interface AuthUserResponse {
  data: {
    user: {
      id: string;
      last_sign_in_at?: string | null;
      email_confirmed_at?: string | null;
      confirmed_at?: string | null;
      app_metadata: Record<string, unknown>;
      phone_confirmed_at?: string;
    } | null;
  };
  error: unknown;
}

/**
 * Reconstructs user auth data from bulk response
 */
export function constructAuthMap(authResults: AuthUserResponse[]): Record<
  string,
  {
    lastSignInAt: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
  }
> {
  return Object.fromEntries(
    authResults
      .filter((res) => !res.error && res.data?.user)
      .map((res) => {
        const u = res.data.user!;
        const appMetadata = u.app_metadata as { identity_verified?: boolean };
        const userWithPhone = u as typeof u & { phone_confirmed_at?: string };

        return [
          u.id,
          {
            lastSignInAt: u.last_sign_in_at ?? null,
            emailVerified: Boolean(u.email_confirmed_at ?? u.confirmed_at),
            phoneVerified: Boolean(userWithPhone.phone_confirmed_at),
            identityVerified: Boolean(appMetadata.identity_verified),
          },
        ];
      })
  );
}
