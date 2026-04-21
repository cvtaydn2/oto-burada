import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
}

export interface UserDetailData {
  profile: UserProfile;
  payments: UserPaymentRecord[];
  dopings: UserDopingRecord[];
  listings: { id: string; slug: string; title: string; brand: string; model: string; status: string }[];
  creditTransactions: { id: string; amount: number; type: string; description: string; createdAt: string }[];
  dopingHistory: { id: string; listingId: string; listingTitle: string; dopingType: string; expiresAt: string; createdAt: string }[];
  listingCount: number;
  activeListingCount: number;
}

export function mapProfile(p: Record<string, unknown>, email = ""): UserProfile {
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
  };
}

export async function getUserDetail(userId: string): Promise<UserDetailData | null> {
  const admin = createSupabaseAdminClient();

  const [
    authRes,
    profileRes,
    paymentsRes,
    listingsRes,
    transactionsRes,
    dopingHistoryRes,
  ] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select(
      "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, ban_reason, business_name, business_address, business_logo_url, business_description, tax_id, tax_office, website_url, verified_business, business_slug, created_at, updated_at, trust_score, verification_status, email_verified"
    ).eq("id", userId).single(),
    admin
      .from("payments")
      .select("id, amount, provider, status, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("listings")
      .select("id, slug, title, brand, model, status, featured, featured_until, urgent_until, highlighted_until, created_at")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("doping_applications")
      .select("*, listings(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!profileRes.data) return null;

  const authUser = authRes.data.user;
  const profile = profileRes.data;
  const payments = paymentsRes.data || [];
  const listings = listingsRes.data || [];
  const creditTransactions = transactionsRes.data || [];
  const dopingHistory = dopingHistoryRes.data || [];

  const dopings: UserDopingRecord[] = listings
    .filter((l) => l.featured || l.urgent_until || l.highlighted_until)
    .map((l) => ({
      listingId: l.id,
      listingTitle: l.title || l.id,
      dopingTypes: [
        l.featured ? "featured" : null,
        l.urgent_until ? "urgent" : null,
        l.highlighted_until ? "highlighted" : null,
      ].filter(Boolean) as string[],
      appliedAt: l.created_at,
      featuredUntil: l.featured_until,
      urgentUntil: l.urgent_until,
      highlightedUntil: l.highlighted_until,
    }));

  return {
    profile: mapProfile(profile as Record<string, unknown>, authUser?.email || ""),
    payments: payments as UserPaymentRecord[],
    dopings,
    listings: listings.map((l) => ({ 
      id: l.id, 
      slug: l.slug, 
      title: l.title || l.id, 
      brand: l.brand, 
      model: l.model,
      status: l.status 
    })),
    creditTransactions: creditTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.transaction_type,
      description: t.description,
      createdAt: t.created_at
    })),
    dopingHistory: dopingHistory.map((d: { id: string; listing_id: string; listings: { title: string } | null; doping_type: string; expires_at: string; created_at: string }) => ({
      id: d.id,
      listingId: d.listing_id,
      listingTitle: d.listings?.title || d.listing_id,
      dopingType: d.doping_type,
      expiresAt: d.expires_at,
      createdAt: d.created_at
    })),
    listingCount: listings.length,
    activeListingCount: listings.filter((l) => l.status === "approved").length,
  };
}
