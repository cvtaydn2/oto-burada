import { NextRequest, NextResponse } from "next/server";

import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initiatePaymentSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/services/payment/payment-service";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await PaymentService.initializeCheckoutForm({
      userId: user.id,
      email: user.email!,
      fullName: profile?.full_name || "İsimsiz Kullanıcı",
      phone: profile?.phone || "",
      address: profile?.business_address || "",
      city: profile?.city || "Istanbul",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
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
