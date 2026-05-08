import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { withCronRoute } = await import("@/lib/security");
  const security = await withCronRoute(request);
  if (!security.ok) return security.response;

  try {
    const [{ expireReservations }, { logger }] = await Promise.all([
      import("@/features/reservations/services/reservation-service"),
      import("@/lib/logger"),
    ]);

    const expired = await expireReservations();

    logger.reservation.info("Expire-reservations cron ran", { expired });

    return NextResponse.json({ ok: true, expired });
  } catch (err) {
    const { logger } = await import("@/lib/logger");
    logger.reservation.error("Expire-reservations cron failed", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
