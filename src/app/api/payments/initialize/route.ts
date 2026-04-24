import { NextRequest } from "next/server";

import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";
import { getClientIp } from "@/lib/utils/ip";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { initiatePaymentSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/services/payment/payment-service";

export async function POST(req: NextRequest) {
  // SECURITY: Apply authentication, CSRF protection, and rate limiting
  const security = await withUserAndCsrf(req, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: { limit: 10, windowMs: 60 * 60 * 1000, failClosed: true }, // 10 per hour
    rateLimitKey: "payments:initialize",
  });

  if (!security.ok) {
    return security.response;
  }

  const user = security.user!;

  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();
    const validated = initiatePaymentSchema.safeParse(body);

    if (!validated.success) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek verisi.", 400);
    }

    const { listingId, packageId } = validated.data;
    const pkg = DOPING_PACKAGES.find((p) => p.id === packageId);

    if (!pkg) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz paket seçimi.", 400);
    }

    // Get user profile for buyer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, city, identity_number, business_address")
      .eq("id", user.id)
      .single();

    // F-13: Check listing ownership and status
    const { data: listing } = await supabase
      .from("listings")
      .select("seller_id, status")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "İlan bulunamadı.", 404);
    }

    if (listing.seller_id !== user.id) {
      return apiError(API_ERROR_CODES.FORBIDDEN, "Bu ilan size ait değil.", 403);
    }

    if (listing.status !== "approved") {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Sadece onaylı ilanlara doping yapılabilir.",
        400
      );
    }

    // SECURITY: Validate required profile fields
    if (!profile?.full_name || profile.full_name.trim() === "") {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Lütfen profil bilgilerinizi tamamlayın (Ad Soyad gerekli).",
        400
      );
    }

    if (!profile?.phone || profile.phone.trim() === "") {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Lütfen profil bilgilerinizi tamamlayın (Telefon gerekli).",
        400
      );
    }

    // SECURITY: Get normalized IP address
    const clientIp = await getClientIp();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await PaymentService.initializeCheckoutForm({
      userId: user.id,
      email: user.email!,
      fullName: profile.full_name,
      phone: profile.phone,
      address: profile.business_address || profile.city || "Türkiye",
      city: profile.city || "Istanbul",
      ip: clientIp,
      price: pkg.price,
      basketItems: [
        {
          id: pkg.id,
          name: pkg.name,
          category: "Doping",
          price: pkg.price,
        },
      ],
      callbackUrl: `${baseUrl}/api/payments/callback`,
      listingId,
    });

    return apiSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ödeme başlatılamadı.";
    console.error("[PaymentInitialize] Error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, message, 500);
  }
}
