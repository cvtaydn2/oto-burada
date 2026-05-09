import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { respondToOffer } from "@/features/offers/services/offers/offer-actions";
import { logger } from "@/lib/logger";
import { withUserAndCsrf } from "@/lib/security";

export async function POST(request: Request) {
  const security = await withUserAndCsrf(request);
  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const formData = await request.formData();
    const offerId = formData.get("offerId") as string;
    await respondToOffer(offerId, user.id, "rejected");
    return NextResponse.redirect(new URL("/dashboard/teklifler", request.url));
  } catch (error) {
    logger.reservation.error("Reject offer failed", error);
    return NextResponse.json({ error: "Teklif reddedilemedi." }, { status: 400 });
  }
}
