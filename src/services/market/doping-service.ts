import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { payment } from "@/lib/payment";
import { isPaymentEnabled } from "@/lib/payment/config";
import { DOPING_PRICES, DopingId } from "@/lib/payment/constants";
import { logger } from "@/lib/utils/logger";

export type DopingType = DopingId;

export interface DopingResult {
  success: boolean;
  message: string;
  paymentUrl?: string;
  transactionId?: string;
}

interface DopingUpdates {
  featured?: boolean;
  featured_until?: string | null;
  urgent_until?: string | null;
  highlighted_until?: string | null;
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
  if (!isPaymentEnabled()) {
    return { success: false, message: "Doping ödemeleri henüz aktif değil. Lütfen bizimle iletişime geçin." };
  }
  const admin = createSupabaseAdminClient();

  const now = new Date();
  const SevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const FifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const updates: DopingUpdates = {};
  
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

  // 3. Calculate Total
  const totalAmount = dopingTypes.reduce((sum, type) => sum + DOPING_PRICES[type].price, 0);

  // 4. Process Payment
  const paymentResult = await payment.processPayment({
    amount: totalAmount,
    orderId: `DOP-${listingId}-${Date.now()}`,
    listingId,
    userId,
  });

  if (!paymentResult.success) {
    return { success: false, message: paymentResult.error || "Ödeme işlemi başarısız oldu." };
  }

  // If 3DS is required (paymentUrl provided), return it for redirect
  if (paymentResult.paymentUrl) {
    // We create a pending payment record for tracking
    await admin.from("payments").insert({
      user_id: userId,
      amount: totalAmount,
      provider: "iyzico",
      status: "pending",
      iyzico_token: paymentResult.transactionId,
      metadata: {
        listingId,
        dopingTypes,
        type: "doping",
        durationDays: 7 // simplified
      }
    });

    return { 
      success: true, 
      message: "Ödeme sayfasına yönlendiriliyorsunuz...",
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId
    };
  }

  // 4. Update listing with doping
  const { error } = await admin
    .from("listings")
    .update(updates)
    .eq("id", listingId);

  if (error) return { success: false, message: "Doping uygulanırken bir hata oluştu." };

  // 5. Log payment — transaction_id metadata içinde saklanır (DB kolonu yok)
  await admin.from("payments").insert({
    user_id: userId,
    amount: dopingTypes.length * 50,
    provider: "iyzico",
    status: paymentResult.status,
    metadata: {
      listingId,
      dopingTypes,
      transaction_id: paymentResult.transactionId
    }
  });

  return { success: true, message: "Dopingler başarıyla uygulandı!" };
}
