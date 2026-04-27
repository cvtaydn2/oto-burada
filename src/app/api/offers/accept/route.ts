import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { withUserAndCsrf } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { respondToOffer } from "@/services/offers/offer-service";

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

    // SECURITY: Explicit ownership verification before accepting offer
    // Defense-in-depth: don't rely solely on RLS in service layer
    const { verifyOfferOwnership } = await import("@/services/offers/offer-service");
    const ownership = await verifyOfferOwnership(offerId, user.id);

    if (!ownership.isOwner) {
      logger.reservation.warn("Offer acceptance rejected - user not owner", {
        offerId,
        userId: user.id,
        reason: ownership.reason,
      });
      return NextResponse.json({ error: ownership.reason || "Yetkiniz yok." }, { status: 403 });
    }

    await respondToOffer(offerId, "accepted");
    redirect("/dashboard/teklifler");
  } catch (error) {
    logger.reservation.error("Accept offer failed", error);
    return NextResponse.json({ error: "Teklif kabul edilemedi." }, { status: 400 });
  }
}
