import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DopingService } from "@/services/payment/doping-service";
import { PaymentService } from "@/services/payment/payment-service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 1. Retrieve result from Iyzico
    const result = await PaymentService.retrieveCheckoutResult(token);

    if (result.status === "paid") {
      // 2. Success! Doping was applied via retrieveCheckoutResult's DB update?
      // No, let's explicitly apply doping here or in retrieve.
      // PaymentService.retrieveCheckoutResult updates the payment status.

      const admin = createSupabaseAdminClient();
      const { data: payment } = await admin
        .from("payments")
        .select("*")
        .eq("iyzico_token", token)
        .single();

      if (payment && payment.listing_id && payment.status === "success") {
        // Apply doping
        const packageId = payment.metadata?.basketItems?.[0]?.id || "bump";

        await DopingService.applyDoping({
          userId: payment.user_id,
          listingId: payment.listing_id,
          packageId: packageId,
          paymentId: payment.id,
        });
      }

      return NextResponse.redirect(new URL("/dashboard/payments?status=success", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/payments?status=failure", req.url));
    }
  } catch (error) {
    console.error("[PaymentCallback] Error:", error);
    return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
  }
}
