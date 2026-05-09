import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { respondToOffer } from "@/features/offers/services/offers/offer-actions";
import { logger } from "@/lib/logger";
import { withUserAndCsrf } from "@/lib/security";

export async function POST(request: Request) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "offers:respond",
    userRateLimit: { limit: 10, windowMs: 60000 },
    ipRateLimit: { limit: 20, windowMs: 60000 },
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const formData = await request.formData();
    const offerId = formData.get("offerId") as string;
    const counterPrice = parseInt(formData.get("counterPrice") as string, 10);
    const counterMessage = formData.get("counterMessage") as string | undefined;

    if (!offerId || isNaN(counterPrice) || counterPrice <= 0) {
      return NextResponse.json({ error: "Geçerli bir karşı teklif girin." }, { status: 400 });
    }

    await respondToOffer(offerId, user.id, "counter_offer", counterPrice, counterMessage);
    return NextResponse.redirect(new URL("/dashboard/teklifler", request.url));
  } catch (error) {
    logger.reservation.error("Counter offer failed", error);
    return NextResponse.json({ error: "Karşı teklif gönderilemedi." }, { status: 400 });
  }
}
