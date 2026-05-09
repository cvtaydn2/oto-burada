"use client";

import Link from "next/link";
import { toast } from "sonner";

import { cancelReservationAction, confirmReservationAction } from "@/actions/reservations";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {} from "@/lib";
import { reservation as copy } from "@/lib/ui-strings";
import { formatPrice } from "@/lib/utils/format";
import type { Reservation, ReservationWithListing } from "@/types";

import { ReservationCountdown, ReservationStatusBadge } from "./reservation-countdown";

type ReservationRow = Reservation | ReservationWithListing;

interface DashboardReservationsTableProps {
  reservations: ReservationRow[];
  view: "buyer" | "seller";
}

export function DashboardReservationsTable({
  reservations,
  view,
}: DashboardReservationsTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
        <p className="text-sm text-muted-foreground">{copy.noReservations}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="text-xs">İlan</TableHead>
            <TableHead className="text-xs text-right">{copy.depositAmount}</TableHead>
            <TableHead className="text-xs">Durum</TableHead>
            <TableHead className="text-xs">Süre</TableHead>
            <TableHead className="text-xs text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((res) => (
            <ReservationTableRow key={res.id} reservation={res} view={view} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getListingLabel(reservation: ReservationRow): string {
  if ("listing" in reservation) {
    return reservation.listing.title;
  }
  return `#${reservation.listing_id.slice(0, 8)}`;
}

function ReservationTableRow({
  reservation,
  view,
}: {
  reservation: ReservationRow;
  view: "buyer" | "seller";
}) {
  const canCancel =
    view === "buyer"
      ? reservation.status === "pending_payment" || reservation.status === "active"
      : reservation.status === "pending_payment";

  const canConfirm = view === "seller" && reservation.status === "pending_payment";

  async function handleCancel() {
    const result = await cancelReservationAction(reservation.id);
    if (!result.ok) {
      toast.error(result.error ?? "İptal edilemedi.");
      return;
    }
    toast.success("Rezervasyon iptal edildi.");
  }

  async function handleConfirm() {
    const result = await confirmReservationAction(reservation.id);
    if (!result.ok) {
      toast.error(result.error ?? "Onaylanamadı.");
      return;
    }
    toast.success("Rezervasyon onaylandı.");
  }

  const listingSlug = "listing" in reservation ? reservation.listing.slug : reservation.listing_id;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/listing/${listingSlug}`} className="text-sm hover:underline">
          {getListingLabel(reservation)}
        </Link>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatPrice(reservation.amount_deposit)} TL
      </TableCell>
      <TableCell>
        <ReservationStatusBadge status={reservation.status} />
      </TableCell>
      <TableCell>
        {reservation.status === "pending_payment" ? (
          <ReservationCountdown expiresAt={reservation.expires_at} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {canConfirm && (
            <Button
              onClick={handleConfirm}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
            >
              Onayla
            </Button>
          )}
          <Link
            href={`/listing/${listingSlug}`}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Görüntüle
          </Link>
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-xs text-red-600 hover:text-red-700 underline">
                  {copy.cancelButton}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rezervasyonu İptal Et</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu rezervasyonu iptal etmek istediğinizden emin misiniz?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <Button
                    onClick={handleCancel}
                    className="h-10 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                  >
                    {copy.cancelButton}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
