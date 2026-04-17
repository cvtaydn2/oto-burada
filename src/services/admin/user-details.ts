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

export interface UserDetailData {
  profile: any;
  payments: UserPaymentRecord[];
  dopings: UserDopingRecord[];
  listings: { id: string; title: string; status: string }[];
  creditTransactions: any[];
  dopingHistory: any[];
  listingCount: number;
  activeListingCount: number;
}

export function mapProfile(p: any) {
  return {
    id: p.id,
    fullName: p.full_name || "",
    phone: p.phone || "",
    city: p.city || "",
    avatarUrl: p.avatar_url,
    role: p.role || "user",
    userType: p.user_type || "individual",
    balanceCredits: p.balance_credits || 0,
    isVerified: p.is_verified || false,
    isBanned: p.is_banned || false,
    businessName: p.business_name,
    businessSlug: p.business_slug,
    verifiedBusiness: p.verified_business,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export async function getUserDetail(userId: string): Promise<UserDetailData | null> {
  const admin = createSupabaseAdminClient();

  const [
    { data: profile },
    { data: payments },
    { data: listings },
    { data: creditTransactions },
    { data: dopingHistory },
  ] = await Promise.all([
    admin.from("profiles").select(
      "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, business_name, business_address, business_logo_url, business_description, tax_id, tax_office, website_url, verified_business, business_slug, created_at, updated_at"
    ).eq("id", userId).single(),
    admin
      .from("payments")
      .select("id, amount, provider, status, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("listings")
      .select("id, title, status, featured, featured_until, urgent_until, highlighted_until, created_at")
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

  if (!profile) return null;

  const dopings: UserDopingRecord[] = (listings || [])
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
    profile: mapProfile(profile),
    payments: (payments || []) as UserPaymentRecord[],
    dopings,
    listings: (listings || []).map((l) => ({ id: l.id, title: l.title || l.id, status: l.status })),
    creditTransactions: (creditTransactions || []).map((t: any) => ({
      id: t.id,
      amount: t.amount,
      type: t.transaction_type,
      description: t.description,
      createdAt: t.created_at
    })),
    dopingHistory: (dopingHistory || []).map((d: any) => ({
      id: d.id,
      listingId: d.listing_id,
      listingTitle: d.listings?.title || d.listing_id,
      dopingType: d.doping_type,
      expiresAt: d.expires_at,
      createdAt: d.created_at
    })),
    listingCount: (listings || []).length,
    activeListingCount: (listings || []).filter((l) => l.status === "approved").length,
  };
}
