import { NextRequest, NextResponse } from "next/server";

import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { listingId, packageId } = validated.data;
    const pkg = DOPING_PACKAGES.find((p) => p.id === packageId);

    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // Get user profile for buyer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // SECURITY: Validate required profile fields
    if (!profile?.full_name || profile.full_name.trim() === "") {
      return NextResponse.json(
        { error: "Lütfen profil bilgilerinizi tamamlayın (Ad Soyad gerekli)" },
        { status: 400 }
      );
    }

    if (!profile?.phone || profile.phone.trim() === "") {
      return NextResponse.json(
        { error: "Lütfen profil bilgilerinizi tamamlayın (Telefon gerekli)" },
        { status: 400 }
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

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ödeme başlatılamadı.";
    console.error("[PaymentInitialize] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
