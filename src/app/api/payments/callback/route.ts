import { NextRequest, NextResponse } from "next/server";

import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { DopingService } from "@/services/payment/doping-service";
import { PaymentService } from "@/services/payment/payment-service";

/**
 * Payment Callback Handler
 *
 * SECURITY ARCHITECTURE:
 * This endpoint is called by the user's browser after Iyzico redirects them back.
 * We CANNOT verify Iyzico signature here because the request comes from the browser.
 *
 * Defense Strategy:
 * 1. Token is single-use and validated against Iyzico API
 * 2. Payment status is fetched directly from Iyzico (not trusted from request)
 * 3. ATOMIC status update prevents race conditions
 * 4. Idempotency prevents double-processing
 * 5. Webhook (with signature) is the authoritative source
 *
 * This endpoint is for UX only - actual payment confirmation happens via webhook.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      logger.api.warn("Payment callback without token");
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    const admin = createSupabaseAdminClient();

    // SECURITY: Atomic check-and-update to prevent race conditions
    // This query will only succeed once, even if callback is called multiple times
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id, status, fulfilled_at, user_id, listing_id, package_id, amount")
      .eq("iyzico_token", token)
      .single();

    if (!existingPayment) {
      logger.api.error("Payment not found for callback", { token });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // IDEMPOTENCY: If already fulfilled, just redirect to success
    if (existingPayment.fulfilled_at) {
      logger.api.info("Payment callback for already fulfilled payment (idempotent)", {
        paymentId: existingPayment.id,
        token,
      });
      return NextResponse.redirect(new URL("/dashboard/payments?status=success", req.url));
    }

    // 1. SECURITY: Retrieve result directly from Iyzico API (not from request)
    // This is the critical security measure - we don't trust the callback data
    let result;
    try {
      result = await PaymentService.retrieveCheckoutResult(token);
    } catch (error) {
      logger.api.error("Failed to retrieve payment from Iyzico", {
        token,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    if (result.status !== "paid") {
      logger.api.info("Payment callback for non-paid payment", {
        token,
        status: result.status,
      });
      return NextResponse.redirect(new URL("/dashboard/payments?status=failure", req.url));
    }

    // 2. SECURITY: Validate payment status from database
    if (existingPayment.status !== "success") {
      logger.api.warn("Payment callback for non-success payment in DB", {
        token,
        status: existingPayment.status,
        paymentId: existingPayment.id,
      });
      return NextResponse.redirect(new URL("/dashboard/payments?status=failure", req.url));
    }

    // 3. SECURITY: Extract package_id from database record (not metadata)
    const packageId = existingPayment.package_id;

    if (!packageId) {
      logger.api.error("No package ID in payment record", { paymentId: existingPayment.id });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 4. SECURITY: Verify package exists and price matches
    const dopingPackage = DOPING_PACKAGES.find((p) => p.id === packageId);

    if (!dopingPackage) {
      logger.api.error("Invalid doping package ID", { packageId, paymentId: existingPayment.id });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 5. SECURITY: Verify payment amount matches package price
    if (Math.abs(existingPayment.amount - dopingPackage.price) > 0.01) {
      logger.api.error("Payment amount mismatch", {
        paymentId: existingPayment.id,
        paymentAmount: existingPayment.amount,
        packagePrice: dopingPackage.price,
        packageId,
      });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 6. SECURITY: Verify listing belongs to the user who paid
    if (existingPayment.listing_id) {
      const { data: listing } = await admin
        .from("listings")
        .select("user_id")
        .eq("id", existingPayment.listing_id)
        .single();

      if (!listing || listing.user_id !== existingPayment.user_id) {
        logger.api.error("Listing ownership mismatch", {
          paymentId: existingPayment.id,
          listingId: existingPayment.listing_id,
          paymentUserId: existingPayment.user_id,
          listingUserId: listing?.user_id,
        });
        return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
      }

      // 7. ATOMIC FULFILLMENT: Update fulfilled_at ONLY if it's still NULL
      // This prevents race conditions - only one callback will succeed
      const { data: updatedPayment, error: updateError } = await admin
        .from("payments")
        .update({ fulfilled_at: new Date().toISOString() })
        .eq("id", existingPayment.id)
        .is("fulfilled_at", null) // CRITICAL: Only update if not already fulfilled
        .select()
        .single();

      if (updateError || !updatedPayment) {
        // Another callback already fulfilled this payment
        logger.api.info(
          "Payment already fulfilled by another callback (race condition prevented)",
          {
            paymentId: existingPayment.id,
          }
        );
        return NextResponse.redirect(new URL("/dashboard/payments?status=success", req.url));
      }

      // 8. Apply doping (only if we successfully claimed the fulfillment)
      try {
        await DopingService.applyDoping({
          userId: existingPayment.user_id,
          listingId: existingPayment.listing_id,
          packageId: packageId,
          paymentId: existingPayment.id,
        });

        logger.api.info("Doping applied successfully via callback", {
          paymentId: existingPayment.id,
          listingId: existingPayment.listing_id,
          packageId,
        });
      } catch (dopingError) {
        // If doping fails, log but don't fail the callback
        // The webhook will retry or admin can manually fix
        logger.api.error("Doping application failed in callback", {
          paymentId: existingPayment.id,
          error: dopingError instanceof Error ? dopingError.message : String(dopingError),
        });
        // Don't rollback fulfilled_at - webhook will handle retry
      }
    }

    return NextResponse.redirect(new URL("/dashboard/payments?status=success", req.url));
  } catch (error) {
    logger.api.error("Payment callback error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
  }
}
