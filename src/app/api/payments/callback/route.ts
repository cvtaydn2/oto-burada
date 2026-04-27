import { NextRequest, NextResponse } from "next/server";

import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { applyDopingPackage } from "@/services/payments/doping-logic";
import { retrievePaymentResult } from "@/services/payments/payment-logic";

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
/**
 * GET handler for Iyzico redirect (if they use GET)
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    logger.api.warn("Payment callback GET without token");
    return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
  }
  return handleCallback(token, req);
}

/**
 * POST handler for Iyzico redirect (if they use POST)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      logger.api.warn("Payment callback POST without token");
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    return handleCallback(token, req);
  } catch (error) {
    logger.api.error("Payment callback POST parsing error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
  }
}

/**
 * Shared callback logic
 */
async function handleCallback(token: string, req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();

    const { data: existingPayment, error: paymentError } = await admin
      .from("payments")
      .select("id, status, user_id, listing_id, package_id, amount")
      .eq("iyzico_token", token)
      .single();

    if (paymentError || !existingPayment) {
      logger.api.error("Payment not found for callback", { token, error: paymentError });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 1. SECURITY: Retrieve result directly from Iyzico API (not from request)
    // This is the critical security measure - we don't trust the callback data
    let result;
    try {
      result = await retrievePaymentResult(token, existingPayment.user_id);
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

      // F-04: Do NOT release the lock. Mark status as failure to prevent retry race conditions.
      await admin.from("payments").update({ status: "failure" }).eq("id", existingPayment.id);

      return NextResponse.redirect(new URL("/dashboard/payments?status=failure", req.url));
    }

    // 2. SECURITY: Extract package_id from database record (not metadata)
    const packageId = existingPayment.package_id;

    if (!packageId) {
      logger.api.error("No package ID in payment record", { paymentId: existingPayment.id });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 3. SECURITY: Verify package exists and price matches
    const dopingPackage = DOPING_PACKAGES.find((p) => p.id === packageId);

    if (!dopingPackage) {
      logger.api.error("Invalid doping package ID", { packageId, paymentId: existingPayment.id });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 4. SECURITY: Verify payment amount matches package price
    if (Math.abs(existingPayment.amount - dopingPackage.price) > 0.01) {
      logger.api.error("Payment amount mismatch", {
        paymentId: existingPayment.id,
        paymentAmount: existingPayment.amount,
        packagePrice: dopingPackage.price,
        packageId,
      });
      return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
    }

    // 5. SECURITY: Verify listing belongs to the user who paid
    if (existingPayment.listing_id) {
      const { data: listing } = await admin
        .from("listings")
        .select("seller_id") // FIXED: Use correct column name
        .eq("id", existingPayment.listing_id)
        .single();

      if (!listing || listing.seller_id !== existingPayment.user_id) {
        logger.api.error("Listing ownership mismatch", {
          paymentId: existingPayment.id,
          listingId: existingPayment.listing_id,
          paymentUserId: existingPayment.user_id,
          listingSellerId: listing?.seller_id, // FIXED: Use correct field name
        });

        // F-04: Do NOT release the lock.
        await admin.from("payments").update({ status: "failure" }).eq("id", existingPayment.id);

        return NextResponse.redirect(new URL("/dashboard/payments?status=error", req.url));
      }

      // 6. Apply doping through the idempotent RPC. The RPC owns fulfilled_at.
      try {
        await applyDopingPackage({
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
