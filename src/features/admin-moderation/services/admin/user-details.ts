import {
  mapProfile,
  UserDetailData,
  UserDopingRecord,
  UserPaymentRecord,
  UserProfile,
} from "./user-pure-logic";
import { fetchUserDetailsComposite } from "./user-records";

// Keep existing re-exports for external users
export type { UserDetailData, UserDopingRecord, UserPaymentRecord, UserProfile };

export async function getUserDetail(userId: string): Promise<UserDetailData | null> {
  const [authRes, profileRes, paymentsRes, listingsRes, transactionsRes, dopingHistoryRes] =
    await fetchUserDetailsComposite(userId);

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
      status: l.status,
    })),
    creditTransactions: creditTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.transaction_type,
      description: t.description || "",
      createdAt: t.created_at,
    })),
    dopingHistory: dopingHistory.map(
      (d: {
        id: string;
        listing_id: string;
        listings: { title: string } | null;
        doping_type: string;
        expires_at: string;
        created_at: string;
      }) => ({
        id: d.id,
        listingId: d.listing_id,
        listingTitle: d.listings?.title || d.listing_id,
        dopingType: d.doping_type,
        expiresAt: d.expires_at,
        createdAt: d.created_at,
      })
    ),
    listingCount: listings.length,
    activeListingCount: listings.filter((l) => l.status === "approved").length,
  };
}
