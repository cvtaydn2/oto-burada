import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { withUserAndCsrfToken } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { respondToOffer } from "@/services/offers/offer-service";

export async function POST(request: Request) {
  const security = await withUserAndCsrfToken(request);
  if (!security.ok) return security.response;

  try {
    const formData = await request.formData();
    const offerId = formData.get("offerId") as string;
    await respondToOffer(offerId, "rejected");
    redirect("/dashboard/teklifler");
  } catch (error) {
    logger.reservation.error("Reject offer failed", error);
    return NextResponse.json({ error: "Teklif reddedilemedi." }, { status: 400 });
  }
}
