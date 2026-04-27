import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DopingService } from "@/services/payments/doping-logic";

export async function activateDopingUseCase(params: {
  userId: string;
  listingId: string;
  packageId: string;
  paymentId: string;
}) {
  const admin = createSupabaseAdminClient();

  // 1. Verify payment status before activating
  const { data: payment } = await admin
    .from("payments")
    .select("status")
    .eq("id", params.paymentId)
    .single();

  if (!payment || payment.status !== "success") {
    return { success: false, error: "Ödeme onaylanmadığı için doping aktif edilemedi." };
  }

  try {
    // 2. Delegate to service (uses activate_doping RPC)
    const purchase = await DopingService.applyDoping(params);

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
