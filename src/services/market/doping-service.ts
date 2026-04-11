import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export type DopingType = "featured" | "urgent" | "highlighted";

export interface DopingResult {
  success: boolean;
  message: string;
}

/**
 * Applies premium doping effects to a listing.
 * Extends the visibility of the listing based on the doping type.
 */
export async function applyDopingToListing(
  listingId: string, 
  userId: string, 
  dopingTypes: DopingType[]
): Promise<DopingResult> {
  if (!hasSupabaseAdminEnv()) return { success: false, message: "Server connection failed" };
  const admin = createSupabaseAdminClient();

  const now = new Date();
  const SevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const FifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const updates: any = {};
  
  if (dopingTypes.includes("featured")) {
    updates.featured = true;
    updates.featured_until = SevenDaysLater;
  }
  
  if (dopingTypes.includes("urgent")) {
    updates.urgent_until = SevenDaysLater;
  }
  
  if (dopingTypes.includes("highlighted")) {
    updates.highlighted_until = FifteenDaysLater;
  }

  // 1. Verify listing ownership
  const { data: listing } = await admin
    .from("listings")
    .select("seller_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.seller_id !== userId) {
    return { success: false, message: "İlan sahibi doğrulanamadı." };
  }

  // 2. Perform updates
  const { error } = await admin
    .from("listings")
    .update(updates)
    .eq("id", listingId);

  if (error) return { success: false, message: "Doping uygulanırken bir hata oluştu." };

  // 3. Log payment (Mock)
  await admin.from("payments").insert({
    user_id: userId,
    amount: dopingTypes.length * 50, // Simplified price
    provider: "iyzico_mock",
    status: "success",
    metadata: { listingId, dopingTypes }
  });

  return { success: true, message: "Dopingler başarıyla uygulandı!" };
}
