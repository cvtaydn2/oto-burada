"use client";

import { TriangleAlert } from "lucide-react";

import { BulkActions } from "@/features/admin-moderation/components/bulk-actions";
import { ModerationCard } from "@/features/admin-moderation/components/moderation-card";
// Admin Moderation Feature Components/Hooks
import { useModerationLogic } from "@/features/admin-moderation/hooks/use-moderation-logic";
import { AppErrorBoundary } from "@/features/shared/components/error-boundary";
import { Button } from "@/features/ui/components/button";
import { type Listing } from "@/types";

interface ListingsModerationProps {
  pendingListings: Listing[];
}

export function ListingsModeration({ pendingListings }: ListingsModerationProps) {
  const { state, actions } = useModerationLogic(pendingListings);

  if (pendingListings.length === 0) {
    return (
      <section className="rounded-2xl border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
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
    <section className="rounded-2xl border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
            Moderasyon
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bekleyen ilanlar</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            İlanları kontrol ederek yayınlama ya da reddetme kararını buradan verebilirsin.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          {pendingListings.length} ilan bekliyor
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-border">
        <Button
          type="button"
          onClick={() => {
            actions.setActiveTab("all");
            actions.setSelectedListingIds([]);
          }}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            state.activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Tümü ({pendingListings.length})
        </Button>
        <Button
          type="button"
          onClick={() => {
            actions.setActiveTab("ai_flagged");
            actions.setSelectedListingIds([]);
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            state.activeTab === "ai_flagged"
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-muted-foreground hover:text-rose-500"
          }`}
        >
          <TriangleAlert className="size-4" />
          AI Tarafından Kırmızı İşaretlenenler (
          {
            pendingListings.filter(
              (l) =>
                l.status === "flagged" ||
                l.status === "pending_ai_review" ||
                (l.fraudScore ?? 0) > 0
            ).length
          }
          )
        </Button>
      </div>

      {state.errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {state.errorMessage}
        </div>
      )}

      {state.successMessage && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {state.successMessage}
        </div>
      )}

      <div className="mt-6 space-y-6">
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

        {state.filteredListings.length === 0 && (
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-foreground">Bu sekmede ilan bulunmuyor</h3>
          </div>
        )}

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
