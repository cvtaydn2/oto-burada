"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, MessageCircle, XCircle } from "lucide-react";
import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  listingRejectReasonCodes,
  listingRejectReasonDefaultExplanations,
  listingRejectReasonLabels,
} from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type { Listing, ListingRejectReasonCode } from "@/types";

interface ModerationDecisionProps {
  listing: Listing;
  activeAction: string | null;
  handleModeration: (id: string, action: "approve" | "reject") => void;
  notesByListingId: Record<string, string>;
  setNotesByListingId: (fn: (current: Record<string, string>) => Record<string, string>) => void;
  rejectReasonByListingId: Partial<Record<string, ListingRejectReasonCode>>;
  setRejectReasonByListingId: (
    fn: (
      current: Partial<Record<string, ListingRejectReasonCode>>
    ) => Partial<Record<string, ListingRejectReasonCode>>
  ) => void;
}

export function ModerationDecision({
  listing,
  activeAction,
  handleModeration,
  notesByListingId,
  setNotesByListingId,
  rejectReasonByListingId,
  setRejectReasonByListingId,
}: ModerationDecisionProps) {
  const approving = activeAction === `${listing.id}:approve`;
  const rejecting = activeAction === `${listing.id}:reject`;
  const actionBusy = approving || rejecting;
  const selectedReasonCode = rejectReasonByListingId[listing.id];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            MODERASYON KARARI
          </Label>
          {!selectedReasonCode && (
            <span className="text-[9px] font-bold text-rose-500 animate-pulse">
              ! RED KARARI İÇİN NEDEN KODU ZORUNLU
            </span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {listingRejectReasonCodes.map((reasonCode) => (
            <Button
              key={reasonCode}
              type="button"
              onClick={() =>
                setRejectReasonByListingId((current) => ({ ...current, [listing.id]: reasonCode }))
              }
              className={cn(
                "h-auto min-h-16 rounded-2xl border px-3 py-3 text-left text-[11px] font-semibold normal-case transition-all",
                selectedReasonCode === reasonCode
                  ? "border-rose-300 bg-rose-50 text-rose-700 shadow-sm ring-2 ring-rose-200"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              <span className="block space-y-1">
                <span className="block text-xs font-bold uppercase tracking-wide">
                  {listingRejectReasonLabels[reasonCode]}
                </span>
                <span className="block text-[11px] font-medium leading-5 text-muted-foreground">
                  {listingRejectReasonDefaultExplanations[reasonCode]}
                </span>
              </span>
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Moderatör notu (opsiyonel)
          </Label>
          <textarea
            value={notesByListingId[listing.id] ?? ""}
            onChange={(e) => setNotesByListingId((c) => ({ ...c, [listing.id]: e.target.value }))}
            placeholder={
              selectedReasonCode
                ? listingRejectReasonDefaultExplanations[selectedReasonCode]
                : "Gerekirse satıcıya ek açıklama ekleyin..."
            }
            className={cn(
              "w-full min-h-[100px] rounded-2xl border bg-muted/10 p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:italic",
              !notesByListingId[listing.id]
                ? "border-dashed border-muted-foreground/20"
                : "border-border"
            )}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-border/40">
        <div className="flex items-center gap-4">
          <Link
            href={`/listing/${listing.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 hover:underline"
          >
            PUBLİC SAYFAYI GÖR <ArrowRight className="size-3" />
          </Link>
          <a
            href={`https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2 hover:underline"
          >
            <MessageCircle className="size-3" /> WHATSAPP İLETİŞİM
          </a>
        </div>

        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={actionBusy}
                className="h-12 px-8 rounded-2xl border border-border text-xs font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejecting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}
                REDDET
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>İlanı reddetmek istediğine emin misin?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  &quot;{listing.title}&quot; başlıklı ilan reddedilecek ve satıcıya bildirilecek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleModeration(listing.id, "reject")}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  Reddet
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={actionBusy}
                className="h-12 px-8 rounded-2xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                ONAYLA
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>İlanı onaylamak istediğine emin misin?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  &quot;{listing.title}&quot; başlıklı ilan onaylanacak ve tüm kullanıcılara görünür
                  olacak.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleModeration(listing.id, "approve")}
                  className="bg-primary hover:opacity-90"
                >
                  Onayla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
