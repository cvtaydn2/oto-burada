"use client";

import { Flag } from "lucide-react";
import { usePostHog } from "posthog-js/react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { CompareButton } from "@/components/listings/compare-button";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ShareButton } from "@/components/listings/share-button";
import { ReportListingForm } from "@/components/forms/report-listing-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const posthog = usePostHog();

  return (
    <div className="flex items-center space-x-2">
      <ShareButton
        title={title}
        price={price}
        className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center shadow-sm"
      />
      <CompareButton
        listingId={listingId}
        className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center shadow-sm gap-2"
      />
      <FavoriteButton
        listingId={listingId}
        className="bg-white border border-gray-200 text-gray-600 w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition shadow-sm"
      />
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={() => posthog?.capture("report_dialog_opened", { listingId, sellerId })}
            className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition flex items-center gap-2 shadow-sm"
          >
            <Flag className="size-4" />
            Bildir
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>İlanı Moderasyona Bildir</DialogTitle>
          </DialogHeader>
          <ReportListingForm listingId={listingId} sellerId={sellerId} userId={userId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
