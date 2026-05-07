import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getActiveReservationForListing } from "@/features/reservations/services/reservation-service";

import { ReservationStatusBadge } from "./reservation-countdown";

interface ReservationStatusBannerProps {
  listingId: string;
}

export async function ReservationStatusBanner({ listingId }: ReservationStatusBannerProps) {
  const active = await getActiveReservationForListing(listingId);
  if (!active) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">Bu ilan rezerve edildi</span>
        </div>
        <ReservationStatusBadge status={active.status} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-emerald-700/80">
          {active.amount_deposit.toLocaleString("tr-TR")} TL kapora yatırıldı
        </span>
        {active.seller?.phone && (
          <Link
            href={`https://wa.me/90${active.seller.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-emerald-700 underline"
          >
            Satıcıya mesaj gönder
          </Link>
        )}
      </div>
    </div>
  );
}
