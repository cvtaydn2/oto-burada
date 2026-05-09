import { formatDate } from "@/lib/datetime/date-utils";
import { formatNumber } from "@/lib/utils/format";
import type { Listing } from "@/types";

import { ModerationDecision } from "./moderation-card/ModerationDecision";
import { ModerationEditor } from "./moderation-card/ModerationEditor";
import { ModerationImageGallery } from "./moderation-card/ModerationImageGallery";
import { ModerationInsights } from "./moderation-card/ModerationInsights";

interface ModerationCardProps {
  listing: Listing;
  selectedListingIds: string[];
  toggleListingSelection: (id: string) => void;
  activeAction: string | null;
  handleModeration: (id: string, action: "approve" | "reject") => void;
  editingListingId: string | null;
  setEditingListingId: (id: string | null) => void;
  editValues: { title: string; price: number; description: string } | null;
  setEditValues: (values: { title: string; price: number; description: string } | null) => void;
  handleSaveEdit: () => void;
  isSavingEdit: boolean;
  notesByListingId: Record<string, string>;
  setNotesByListingId: (fn: (current: Record<string, string>) => Record<string, string>) => void;
}

export function ModerationCard({
  listing,
  selectedListingIds,
  toggleListingSelection,
  activeAction,
  handleModeration,
  editingListingId,
  setEditingListingId,
  editValues,
  setEditValues,
  handleSaveEdit,
  isSavingEdit,
  notesByListingId,
  setNotesByListingId,
}: ModerationCardProps) {
  return (
    <article className="bg-card border border-border/50 shadow-sm rounded-2xl transition-[border-color,box-shadow,transform] duration-300 ease-in-out hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Left: Image Context ── */}
        <div className="space-y-6 shrink-0">
          <ModerationImageGallery
            listing={listing}
            selectedListingIds={selectedListingIds}
            toggleListingSelection={toggleListingSelection}
          />

          <div className="space-y-3 px-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                GÖNDERİM TARİHİ
              </span>
              <p className="text-xs font-bold text-foreground">{formatDate(listing.createdAt)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                SİSTEM KODU
              </span>
              <p className="text-xs font-mono font-bold text-slate-400">
                #{listing.id.split("-")[0].toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Content & Actions ── */}
        <div className="flex-1 min-w-0 space-y-8">
          <ModerationEditor
            listing={listing}
            editingListingId={editingListingId}
            setEditingListingId={setEditingListingId}
            editValues={editValues}
            setEditValues={setEditValues}
            handleSaveEdit={handleSaveEdit}
            isSavingEdit={isSavingEdit}
          />

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="size-2 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-600 tracking-tight">
                {listing.brand} / {listing.model}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="size-2 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-600 tracking-tight">
                {listing.year}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="size-2 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-600 tracking-tight">
                {formatNumber(listing.mileage)} KM
              </span>
            </div>
          </div>

          <ModerationInsights listing={listing} />

          <ModerationDecision
            listing={listing}
            activeAction={activeAction}
            handleModeration={handleModeration}
            notesByListingId={notesByListingId}
            setNotesByListingId={setNotesByListingId}
          />
        </div>
      </div>
    </article>
  );
}
