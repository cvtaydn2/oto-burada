"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

import { ReportListingForm } from "@/components/forms/report-listing-form";
import { useAuthUser } from "@/components/shared/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FavoriteButton } from "@/features/marketplace/components/favorite-button";
import { ShareButton } from "@/features/marketplace/components/share-button";
import { captureClientEvent } from "@/lib/telemetry-client";

interface ListingDetailActionsProps {
  listingId: string;
  price: number;
  sellerId: string;
  title: string;
}

export function ListingDetailActions({
  listingId,
  price,
  sellerId,
  title,
}: ListingDetailActionsProps) {
  const { userId } = useAuthUser();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
      <ShareButton
        title={title}
        price={price}
        className="min-h-11 flex-1 rounded-xl border border-border/70 bg-card px-3.5 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-muted/40 sm:flex-none"
      />
      <FavoriteButton
        listingId={listingId}
        className="size-11 rounded-xl border border-border/70 bg-card text-muted-foreground shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
      />
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            onClick={() => captureClientEvent("report_dialog_opened", { listingId, sellerId })}
            className="min-h-11 flex-1 rounded-xl border border-border/70 bg-card px-3.5 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 sm:flex-none"
          >
            <Flag className="size-4" />
            Bildir
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>İlanı Moderasyona Bildir</DialogTitle>
            <DialogDescription className="sr-only">
              Bu ilanı kurallara aykırı olduğunu düşünüyorsanız moderasyona bildirin.
            </DialogDescription>
          </DialogHeader>
          <ReportListingForm
            listingId={listingId}
            sellerId={sellerId}
            userId={userId}
            onSuccess={() => setReportOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
