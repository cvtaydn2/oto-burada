"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ListingService } from "@/services/listings/listing-service";
import type { Listing } from "@/types";

export function useListingActions(listings: Listing[]) {
  const router = useRouter();
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [bumpingId, setBumpingId] = useState<string | null>(null);
  const [bumpMessage, setBumpMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

  const handleArchive = async (listingId: string) => {
    setArchivingId(listingId);
    setArchiveError(null);
    const listing = listings.find((l) => l.id === listingId);
    const isCurrentlyArchived = listing?.status === "archived";

    try {
      if (isCurrentlyArchived) {
        const { success, error } = await ListingService.bulkDraft([listingId]);
        if (!success) {
          setArchiveError(error?.message ?? "İlan taslağa alınamadı.");
          return;
        }
      } else {
        const { success, error } = await ListingService.archiveListing(listingId);
        if (!success) {
          setArchiveError(error?.message ?? "İlan arşive alınamadı.");
          return;
        }
      }
      router.refresh();
    } finally {
      setArchivingId(null);
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    setIsBulkArchiving(true);
    setArchiveError(null);
    try {
      const { success, error } = await ListingService.bulkArchive(selectedIds);
      if (success) {
        setSelectedIds([]);
        router.refresh();
      } else {
        setArchiveError(error?.message || "Toplu arşivleme sırasında hata oluştu.");
      }
    } catch {
      setArchiveError("Bir hata oluştu.");
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsBulkArchiving(true);
    try {
      const { success, error } = await ListingService.bulkDelete(selectedIds);
      if (success) {
        setSelectedIds([]);
        router.refresh();
      } else {
        setArchiveError(error?.message || "Toplu silme sırasında hata oluştu.");
      }
    } catch {
      setArchiveError("Bir hata oluştu.");
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const handleBump = async (listingId: string) => {
    setBumpingId(listingId);
    setBumpMessage(null);
    try {
      const { success, data, error } = await ListingService.bumpListing(listingId);
      if (!success) {
        setBumpMessage(error?.message ?? "İlan yenilenemedi.");
        return;
      }
      setBumpMessage(data?.message ?? "İlan yenilendi!");
      router.refresh();
    } finally {
      setBumpingId(null);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return {
    archivingId,
    archiveError,
    setArchiveError,
    bumpingId,
    bumpMessage,
    setBumpMessage,
    selectedIds,
    setSelectedIds,
    isBulkArchiving,
    handleArchive,
    handleBulkArchive,
    handleBulkDelete,
    handleBump,
    toggleSelect,
    clearSelection,
  };
}
