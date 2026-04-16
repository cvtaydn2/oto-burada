import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { isPaymentEnabled } from "@/lib/payment/config";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ success: false, error: "Plan ID gerekli." }, { status: 400 });
    }

    // Attempt logged to PostHog for funnel tracking
    logger.payments.info("Plan purchase attempted", { planId, userId: user.id });

    if (!isPaymentEnabled()) {
      return NextResponse.json({
        success: false,
        error: "Ödeme sistemi henüz aktif değil. Lütfen bizimle iletişime geçin.",
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: "Ödeme entegrasyonu henüz tamamlanmadı.",
    }, { status: 501 });

  } catch (error) {
    // Unexpected server error — log + send to PostHog
    logger.payments.error("Purchase plan unexpected error", error);
    captureServerError("Purchase plan unexpected error", "payments", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
