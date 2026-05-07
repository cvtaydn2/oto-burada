import { NextResponse } from "next/server";

import { expireReservations } from "@/features/reservations/services/reservation-service";
import { logger } from "@/features/shared/lib/logger";
import { withCronRoute } from "@/features/shared/lib/security";

export async function POST(request: Request) {
  const security = await withCronRoute(request);
  if (!security.ok) return security.response;

  try {
    const expired = await expireReservations();

    logger.reservation.info("Expire-reservations cron ran", { expired });

    return NextResponse.json({ ok: true, expired });
  } catch (err) {
    logger.reservation.error("Expire-reservations cron failed", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
