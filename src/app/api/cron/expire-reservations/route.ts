import { NextResponse } from "next/server";

import { logger } from "@/lib/utils/logger";
import { expireReservations } from "@/services/reservations/reservation-service";

export async function POST() {
  try {
    const expired = await expireReservations();

    logger.reservation.info("Expire-reservations cron ran", { expired });

    return NextResponse.json({ ok: true, expired });
  } catch (err) {
    logger.reservation.error("Expire-reservations cron failed", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
