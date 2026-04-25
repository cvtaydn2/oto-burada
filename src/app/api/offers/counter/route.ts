import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { withUserAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { respondToOffer } from "@/services/offers/offer-service";

export async function POST(request: Request) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "offers:respond",
    userRateLimit: { limit: 10, windowMs: 60000 },
    ipRateLimit: { limit: 20, windowMs: 60000 },
  });
  if (!security.ok) return security.response;

  try {
    const formData = await request.formData();
    const offerId = formData.get("offerId") as string;
    const counterPrice = parseInt(formData.get("counterPrice") as string, 10);
    const counterMessage = formData.get("counterMessage") as string | undefined;

    if (!offerId || isNaN(counterPrice) || counterPrice <= 0) {
      return NextResponse.json({ error: "Geçerli bir karşı teklif girin." }, { status: 400 });
    }

    await respondToOffer(offerId, "counter_offer", counterPrice, counterMessage);
    redirect("/dashboard/teklifler");
  } catch (error) {
    logger.reservation.error("Counter offer failed", error);
    return NextResponse.json({ error: "Karşı teklif gönderilemedi." }, { status: 400 });
  }
}
