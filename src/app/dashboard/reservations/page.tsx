import type { Metadata } from "next";

import { requireUser } from "@/features/auth/lib/session";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardReservationsTable } from "@/features/reservations/components/dashboard-reservations-table";
import {
  getReservationsByBuyer,
  getReservationsBySeller,
} from "@/features/reservations/services/reservation-service";
import { reservation as copy } from "@/features/shared/lib/ui-strings";

export const metadata: Metadata = {
  title: `${copy.title} — OtoBurada`,
};

export const dynamic = "force-dynamic";

export default async function DashboardReservationsPage() {
  const user = await requireUser();

  const [buyerReservations, sellerReservations] = await Promise.all([
    getReservationsByBuyer(user.id),
    getReservationsBySeller(user.id),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-4 py-6 sm:py-8 md:py-10 lg:px-10 lg:py-12 bg-background min-h-screen">
      <DashboardHeader userEmail={user.email} />
      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">{copy.buyerTitle}</h2>
          <DashboardReservationsTable reservations={buyerReservations} view="buyer" />
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">{copy.sellerTitle}</h2>
          <DashboardReservationsTable reservations={sellerReservations} view="seller" />
        </section>
      </div>
    </div>
  );
}
