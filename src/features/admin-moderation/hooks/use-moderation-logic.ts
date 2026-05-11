"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState } from "react";

import { useErrorCapture } from "@/hooks/use-error-capture";
import type { Listing, ListingRejectReasonCode } from "@/types";

export function useModerationLogic(pendingListings: Listing[]) {
  const { captureError, captureFailure, captureSuccess } = useErrorCapture(
    "admin-listings-moderation"
  );
  const router = useRouter();

  // State
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activeBulkAction, setActiveBulkAction] = useState<"approve" | "reject" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notesByListingId, setNotesByListingId] = useState<Record<string, string>>({});
  const [rejectReasonByListingId, setRejectReasonByListingId] = useState<
    Partial<Record<string, ListingRejectReasonCode>>
  >({});
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState("");
  const [bulkRejectReasonCode, setBulkRejectReasonCode] = useState<
    ListingRejectReasonCode | undefined
  >(undefined);

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    title: string;
    price: number;
    description: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "ai_flagged">("all");

  const [optimisticListings, addOptimisticAction] = useOptimistic(
    pendingListings,
    (state, idToRemove: string) => state.filter((l) => l.id !== idToRemove)
  );

  // Filtering
  const filteredListings =
    activeTab === "ai_flagged"
      ? optimisticListings.filter(
          (l) =>
            l.status === "flagged" || l.status === "pending_ai_review" || (l.fraudScore ?? 0) > 0
        )
      : optimisticListings;

  const allPendingListingIds = filteredListings.map((listing) => listing.id);
  const allSelected =
    filteredListings.length > 0 && selectedListingIds.length === filteredListings.length;

  // Actions
  const handleModeration = async (listingId: string, action: "approve" | "reject") => {
    setActiveAction(`${listingId}:${action}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    addOptimisticAction(listingId);

    try {
      const response = await fetch(`/api/admin/listings/${listingId}/moderate`, {
        body: JSON.stringify({
          action,
          rejectReason:
            action === "reject"
              ? {
                  reasonCode: rejectReasonByListingId[listingId],
                  moderatorNote: notesByListingId[listingId]?.trim() || undefined,
                }
              : undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        const message = payload?.error?.message ?? "Moderasyon işlemi tamamlanamadı.";
        captureFailure("admin_listing_moderation_failed", message, {
          action,
          listingId,
          responseStatus: response.status,
        });
        setErrorMessage(message);
        return;
      }

      setNotesByListingId((current) => ({ ...current, [listingId]: "" }));
      setRejectReasonByListingId((current) => {
        const next = { ...current };
        delete next[listingId];
        return next;
      });
      setSelectedListingIds((current) => current.filter((id) => id !== listingId));
      setSuccessMessage(action === "approve" ? "İlan onaylandı." : "İlan reddedildi.");
      captureSuccess("admin_listing_moderated", { action, listingId });
      router.refresh();
    } catch (err) {
      captureError(err, "handleModeration", { action, listingId });
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleBulkModeration = async (action: "approve" | "reject", listingIds: string[]) => {
    const uniqueListingIds = [...new Set(listingIds)];
    if (uniqueListingIds.length === 0) {
      setErrorMessage("Toplu moderasyon için en az bir ilan seç.");
      return;
    }

    setActiveBulkAction(action);
    setErrorMessage(null);
    setSuccessMessage(null);

    uniqueListingIds.forEach((id) => addOptimisticAction(id));

    try {
      const response = await fetch("/api/admin/listings/bulk-moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          listingIds: uniqueListingIds,
          rejectReason:
            action === "reject"
              ? {
                  reasonCode: bulkRejectReasonCode,
                  moderatorNote: bulkNote.trim() || undefined,
                }
              : undefined,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        const message = payload?.error?.message ?? "Toplu moderasyon işlemi tamamlanamadı.";
        captureFailure("admin_bulk_moderation_failed", message, {
          action,
          attemptedCount: uniqueListingIds.length,
          responseStatus: response.status,
        });
        setErrorMessage(message);
        return;
      }

      const moderatedIds = payload.data?.moderatedListingIds ?? [];
      const skippedIds = payload.data?.skippedListingIds ?? [];
      setSelectedListingIds((current) => current.filter((id) => !moderatedIds.includes(id)));
      setBulkNote("");
      setBulkRejectReasonCode(undefined);
      captureSuccess("admin_bulk_moderation_completed", {
        action,
        moderatedCount: moderatedIds.length,
        skippedCount: skippedIds.length,
      });
      setSuccessMessage(
        skippedIds.length > 0
          ? `${payload.message} ${skippedIds.length} ilan atlandı.`
          : payload.message
      );
      router.refresh();
    } catch (err) {
      captureError(err, "handleBulkModeration", {
        action,
        attemptedCount: uniqueListingIds.length,
      });
      setErrorMessage("Toplu moderasyon sırasında bağlantı hatası oluştu.");
    } finally {
      setActiveBulkAction(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingListingId || !editValues) return;
    setIsSavingEdit(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/listings/${editingListingId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const message = payload.error?.message ?? "Düzenleme kaydedilemedi.";
        captureFailure("admin_listing_edit_failed", message, {
          listingId: editingListingId,
          responseStatus: response.status,
        });
        setErrorMessage(message);
        return;
      }

      setSuccessMessage("İlan güncellendi.");
      captureSuccess("admin_listing_edited", { listingId: editingListingId });
      setEditingListingId(null);
      setEditValues(null);
      router.refresh();
    } catch (err) {
      captureError(err, "handleSaveEdit", { listingId: editingListingId });
      setErrorMessage("Bağlantı hatası.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleListingSelection = (listingId: string) => {
    setSelectedListingIds((current) =>
      current.includes(listingId)
        ? current.filter((id) => id !== listingId)
        : [...current, listingId]
    );
  };

  return {
    state: {
      activeAction,
      activeBulkAction,
      errorMessage,
      successMessage,
      notesByListingId,
      rejectReasonByListingId,
      selectedListingIds,
      bulkNote,
      bulkRejectReasonCode,
      editingListingId,
      editValues,
      isSavingEdit,
      activeTab,
      filteredListings,
      allPendingListingIds,
      allSelected,
    },
    actions: {
      setActiveTab,
      setSelectedListingIds,
      setBulkNote,
      setBulkRejectReasonCode,
      setNotesByListingId,
      setRejectReasonByListingId,
      setEditValues,
      setEditingListingId,
      handleModeration,
      handleBulkModeration,
      handleSaveEdit,
      toggleListingSelection,
      setErrorMessage, // for clearing
      setSuccessMessage,
    },
  };
}
