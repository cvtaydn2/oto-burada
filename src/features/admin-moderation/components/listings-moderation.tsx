"use client";

import { Layers3, TriangleAlert } from "lucide-react";

import { AppErrorBoundary } from "@/components/shared/error-boundary";
import { Button } from "@/components/ui/button";
import { BulkActions } from "@/features/admin-moderation/components/bulk-actions";
import { ModerationCard } from "@/features/admin-moderation/components/moderation-card";
import { useModerationLogic } from "@/features/admin-moderation/hooks/use-moderation-logic";
import { type Listing } from "@/types";

interface ListingsModerationProps {
  pendingListings: Listing[];
}

export function ListingsModeration({ pendingListings }: ListingsModerationProps) {
  const { state, actions } = useModerationLogic(pendingListings);

  const aiFlaggedCount = pendingListings.filter(
    (listing) =>
      listing.status === "flagged" ||
      listing.status === "pending_ai_review" ||
      (listing.fraudScore ?? 0) > 0
  ).length;

  if (pendingListings.length === 0) {
    return (
      <section className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm sm:p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          Moderasyon
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bekleyen ilan yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Yeni ilanlar geldikçe burada inceleme sırası oluşacak.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-background p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              Moderasyon
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Bekleyen ilanlar</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              İncele, gerekirse not ekle ve onay ya da ret kararını güvenli bir sırayla ver.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-foreground">
              {pendingListings.length} ilan bekliyor
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <TriangleAlert className="size-3.5" />
              Önce riskli ilanları doğrula
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-auto sm:min-w-[260px]">
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Toplam kuyruk
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {pendingListings.length}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700/80">
              Risk sinyali
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">{aiFlaggedCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          onClick={() => {
            actions.setActiveTab("all");
            actions.setSelectedListingIds([]);
          }}
          className={`h-auto min-h-16 justify-start rounded-2xl border px-4 py-3 text-left transition-colors ${
            state.activeTab === "all"
              ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              : "border-border/70 bg-background text-foreground hover:bg-muted"
          }`}
        >
          <span className="flex w-full items-start justify-between gap-3">
            <span className="space-y-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Layers3 className="size-4" />
                Tüm bekleyenler
              </span>
              <span className="block text-xs font-medium text-muted-foreground">
                Tam moderasyon kuyruğunu gösterir.
              </span>
            </span>
            <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold">
              {pendingListings.length}
            </span>
          </span>
        </Button>

        <Button
          type="button"
          onClick={() => {
            actions.setActiveTab("ai_flagged");
            actions.setSelectedListingIds([]);
          }}
          className={`h-auto min-h-16 justify-start rounded-2xl border px-4 py-3 text-left transition-colors ${
            state.activeTab === "ai_flagged"
              ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "border-border/70 bg-background text-foreground hover:bg-muted"
          }`}
        >
          <span className="flex w-full items-start justify-between gap-3">
            <span className="space-y-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <TriangleAlert className="size-4" />
                AI kırmızı işaretli
              </span>
              <span className="block text-xs font-medium text-muted-foreground">
                Fraud skoru veya risk işareti olan ilanları öne çıkarır.
              </span>
            </span>
            <span className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">
              {aiFlaggedCount}
            </span>
          </span>
        </Button>
      </div>

      {state.errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {state.errorMessage}
        </div>
      ) : null}

      {state.successMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {state.successMessage}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <BulkActions
          selectedCount={state.selectedListingIds.length}
          allSelected={state.allSelected}
          onToggleAll={() =>
            actions.setSelectedListingIds(state.allSelected ? [] : state.allPendingListingIds)
          }
          activeBulkAction={state.activeBulkAction}
          onBulkModeration={actions.handleBulkModeration}
          selectedListingIds={state.selectedListingIds}
          allPendingListingIds={state.allPendingListingIds}
          bulkNote={state.bulkNote}
          onBulkNoteChange={actions.setBulkNote}
          pendingListingsCount={pendingListings.length}
        />

        {state.filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 py-12 text-center">
            <h3 className="text-lg font-medium text-foreground">Bu sekmede ilan bulunmuyor</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Filtre görünümünü değiştirerek tüm kuyruğu tekrar inceleyebilirsin.
            </p>
          </div>
        ) : null}

        {state.filteredListings.map((listing) => (
          <AppErrorBoundary key={listing.id}>
            <ModerationCard
              listing={listing}
              selectedListingIds={state.selectedListingIds}
              toggleListingSelection={actions.toggleListingSelection}
              activeAction={state.activeAction}
              handleModeration={actions.handleModeration}
              editingListingId={state.editingListingId}
              setEditingListingId={actions.setEditingListingId}
              editValues={state.editValues}
              setEditValues={actions.setEditValues}
              handleSaveEdit={actions.handleSaveEdit}
              isSavingEdit={state.isSavingEdit}
              notesByListingId={state.notesByListingId}
              setNotesByListingId={actions.setNotesByListingId}
            />
          </AppErrorBoundary>
        ))}
      </div>
    </section>
  );
}
