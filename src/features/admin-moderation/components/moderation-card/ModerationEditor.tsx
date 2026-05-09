"use client";

import { LoaderCircle, Pencil, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format";
import type { Listing } from "@/types";

interface ModerationEditorProps {
  listing: Listing;
  editingListingId: string | null;
  setEditingListingId: (id: string | null) => void;
  editValues: { title: string; price: number; description: string } | null;
  setEditValues: (values: { title: string; price: number; description: string } | null) => void;
  handleSaveEdit: () => void;
  isSavingEdit: boolean;
}

export function ModerationEditor({
  listing,
  editingListingId,
  setEditingListingId,
  editValues,
  setEditValues,
  handleSaveEdit,
  isSavingEdit,
}: ModerationEditorProps) {
  const isEditing = editingListingId === listing.id;

  const startEditing = () => {
    setEditingListingId(listing.id);
    setEditValues({
      title: listing.title || listing.brand + " " + listing.model,
      price: listing.price,
      description: listing.description,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="grid gap-4 p-6 rounded-2xl bg-muted/20 border border-dashed border-primary/20">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  İLAN BAŞLIĞI
                </Label>
                <Input
                  type="text"
                  value={editValues?.title}
                  onChange={(e) =>
                    setEditValues(editValues ? { ...editValues, title: e.target.value } : null)
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  SATIŞ FİYATI (TL)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={editValues?.price}
                    onChange={(e) =>
                      setEditValues(
                        editValues ? { ...editValues, price: Number(e.target.value) } : null
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xl font-bold text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all pl-12"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                    ₺
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-foreground tracking-tight line-clamp-2">
                {listing.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary tracking-tighter">
                  {formatCurrency(listing.price)}
                </span>
                <span className="text-xs font-bold text-primary/50 uppercase">TL</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {isSavingEdit ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                KAYDET
              </Button>
              <Button
                onClick={() => setEditingListingId(null)}
                className="h-10 px-5 rounded-xl border border-border bg-card text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2"
              >
                <X className="size-4" /> İPTAL
              </Button>
            </>
          ) : (
            <Button
              onClick={startEditing}
              className="h-10 px-5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <Pencil className="size-4" /> DÜZENLE
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
