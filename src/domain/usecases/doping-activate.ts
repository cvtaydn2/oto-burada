import { applyDopingPackage } from "@/features/payments/services/doping-logic";
import { createSupabaseAdminClient } from "@/features/shared/lib/admin";

export async function activateDopingUseCase(params: {
  userId: string;
  listingId: string;
  packageId: string;
  paymentId: string;
}) {
  const admin = createSupabaseAdminClient();

  // 1. Verify payment status AND ownership before activating
  const { data: payment } = await admin
    .from("payments")
    .select("status, user_id, listing_id")
    .eq("id", params.paymentId)
    .single();

  if (!payment) {
    return { success: false, error: "Ödeme kaydı bulunamadı." };
  }

  if (payment.status !== "success") {
    return { success: false, error: "Ödeme onaylanmadığı için doping aktif edilemedi." };
  }

  // SECURITY: Verify payment belongs to the current user
  if (payment.user_id !== params.userId) {
    return { success: false, error: "Bu ödeme size ait değil." };
  }

  // SECURITY: Verify payment is for the specified listing
  if (payment.listing_id !== params.listingId) {
    return { success: false, error: "Bu ödeme belirtilen ilana ait değil." };
  }

  try {
    // 2. Delegate to service (uses activate_doping RPC)
    const purchase = await applyDopingPackage(params);

    return {
      success: true,
      purchase,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Doping aktif edilirken bir hata oluştu.";
    return {
      success: false,
      error: message,
    };
  }
}
