"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        const res = await fetch("/api/listings/bulk-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [listingId] }),
        });
        const payload = (await res.json().catch(() => null)) as {
          success?: boolean;
          message?: string;
        } | null;
        if (!res.ok || !payload?.success) {
          setArchiveError(payload?.message ?? "İlan taslağa alınamadı.");
          return;
        }
      } else {
        const res = await fetch(`/api/listings/${listingId}/archive`, { method: "POST" });
        const payload = (await res.json().catch(() => null)) as {
          success?: boolean;
          error?: { message: string };
        } | null;
        if (!res.ok || !payload?.success) {
          setArchiveError(payload?.error?.message ?? "İlan arşive alınamadı.");
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
      const res = await fetch("/api/listings/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await res.json();
      if (payload.success) {
        setSelectedIds([]);
        router.refresh();
      } else setArchiveError(payload.message || "Toplu arşivleme sırasında hata oluştu.");
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
      const res = await fetch("/api/listings/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await res.json();
      if (payload.success) {
        setSelectedIds([]);
        router.refresh();
      } else setArchiveError(payload.message || "Toplu silme sırasında hata oluştu.");
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
      const res = await fetch(`/api/listings/${listingId}/bump`, { method: "POST" });
      const payload = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: { message: string };
      } | null;
      if (!res.ok || !payload?.success) {
        setBumpMessage(payload?.error?.message ?? "İlan yenilenemedi.");
        return;
      }
      setBumpMessage(payload.message ?? "İlan yenilendi!");
      router.refresh();
    } finally {
      setBumpingId(null);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const clearSelection = () => setSelectedIds([]);

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
