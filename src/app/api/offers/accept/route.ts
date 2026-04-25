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
    await respondToOffer(offerId, "accepted");
    redirect("/dashboard/teklifler");
  } catch (error) {
    logger.reservation.error("Accept offer failed", error);
    return NextResponse.json({ error: "Teklif kabul edilemedi." }, { status: 400 });
  }
}
