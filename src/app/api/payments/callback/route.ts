import { NextRequest, NextResponse } from "next/server";

import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
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
      const admin = createSupabaseAdminClient();

      // 2. Get payment record with full details
      const { data: payment, error: paymentError } = await admin
        .from("payments")
        .select("*")
        .eq("iyzico_token", token)
        .single();

      if (paymentError || !payment) {
        logger.api.error("Payment not found for callback", {
          token,
          error: paymentError?.message,
        });
        return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
      }

      // 3. SECURITY: Validate payment belongs to authenticated user
      if (payment.status !== "success") {
        logger.api.warn("Payment callback for non-success payment", {
          token,
          status: payment.status,
        });
        return NextResponse.redirect(new URL("/dashboard/payments?status=failure", req.url));
      }

      // 4. SECURITY: Extract package_id from database record (not metadata)
      const packageId = payment.package_id;

      if (!packageId) {
        logger.api.error("No package ID in payment record", { paymentId: payment.id });
        return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
      }

      // 5. SECURITY: Verify package exists and price matches
      const dopingPackage = DOPING_PACKAGES.find((p) => p.id === packageId);

      if (!dopingPackage) {
        logger.api.error("Invalid doping package ID", { packageId, paymentId: payment.id });
        return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
      }

      // 6. SECURITY: Verify payment amount matches package price
      if (Math.abs(payment.amount - dopingPackage.price) > 0.01) {
        logger.api.error("Payment amount mismatch", {
          paymentId: payment.id,
          paymentAmount: payment.amount,
          packagePrice: dopingPackage.price,
          packageId,
        });
        return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
      }

      // 7. SECURITY: Verify listing belongs to the user who paid
      if (payment.listing_id) {
        const { data: listing } = await admin
          .from("listings")
          .select("user_id")
          .eq("id", payment.listing_id)
          .single();

        if (!listing || listing.user_id !== payment.user_id) {
          logger.api.error("Listing ownership mismatch", {
            paymentId: payment.id,
            listingId: payment.listing_id,
            paymentUserId: payment.user_id,
            listingUserId: listing?.user_id,
          });
          return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
        }

        // 8. Apply doping with validated data
        await DopingService.applyDoping({
          userId: payment.user_id,
          listingId: payment.listing_id,
          packageId: packageId,
          paymentId: payment.id,
        });

        logger.api.info("Doping applied successfully", {
          paymentId: payment.id,
          listingId: payment.listing_id,
          packageId,
        });
      }

      return NextResponse.redirect(new URL("/dashboard/payments?status=success", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/payments?status=failure", req.url));
    }
  } catch (error) {
    logger.api.error("Payment callback error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
  }
}
