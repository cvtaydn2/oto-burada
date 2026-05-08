"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

import { ReportListingForm } from "@/features/forms/components/report-listing-form";
import { FavoriteButton } from "@/features/marketplace/components/favorite-button";
import { ShareButton } from "@/features/marketplace/components/share-button";
import { useAuthUser } from "@/features/shared/components/auth-provider";
import { Button } from "@/features/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/ui/components/dialog";
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
    <div className="flex items-center space-x-2">
      <ShareButton
        title={title}
        price={price}
        className="bg-card border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition flex items-center shadow-sm"
      />
      <FavoriteButton
        listingId={listingId}
        className="bg-card border border-border text-muted-foreground w-11 h-11 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition shadow-sm"
      />
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            onClick={() => captureClientEvent("report_dialog_opened", { listingId, sellerId })}
            className="bg-card border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition flex items-center gap-2 shadow-sm"
          >
            <Flag className="size-4" />
            Bildir
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>İlanı Moderasyona Bildir</DialogTitle>
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
