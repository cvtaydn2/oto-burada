"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { queryKeys } from "@/lib/query-keys";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
import type { Listing } from "@/types";

export function useListingActions(listings: Listing[], userId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // ── BUG FIX: Issue BUG-01 - Explicit State Type Annotation ─────────────
  // Prevents type inference from collapsing to `null` and losing type safety
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [bumpMessage, setBumpMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

  // --- Mutations ---

  const archiveMutation = useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      isArchived: boolean;
      currentStatus: Listing["status"];
    }) => {
      const response = await ApiClient.request<{ message: string }>(
        API_ROUTES.LISTINGS.ARCHIVE(id),
        {
          method: "POST",
        }
      );
      if (!response.success) {
        throw new Error(response.error?.message || "İşlem başarısız.");
      }
      return response.data;
    },
    onMutate: async ({ id, isArchived }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.all });

      // Snapshot previous value
      const previousListings = queryClient.getQueryData<Listing[]>(queryKeys.listings.my(userId!));

      // Optimistically update
      if (previousListings && userId) {
        queryClient.setQueryData<Listing[]>(
          queryKeys.listings.my(userId),
          previousListings.map((l) =>
            l.id === id
              ? { ...l, status: isArchived ? "approved" : ("archived" as Listing["status"]) }
              : l
          )
        );
      }

      return { previousListings };
    },
    onError: (err, variables, context) => {
      if (context?.previousListings && userId) {
        queryClient.setQueryData(queryKeys.listings.my(userId), context.previousListings);
      }
      setArchiveError(err instanceof Error ? err.message : "İşlem sırasında bir hata oluştu.");
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      }
      router.refresh(); // Keep for server components sync
    },
  });

  const bumpMutation = useMutation<
    { message: string },
    Error,
    { id: string; status: Listing["status"]; bumpedAt?: string | null },
    { previousListings: Listing[] | undefined }
  >({
    mutationFn: async ({ id }) => {
      const response = await ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.BUMP(id), {
        method: "POST",
        schema: apiResponseSchemas.genericMessage,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Öne çıkarma başarısız.");
      }
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.all });
      const previousListings = queryClient.getQueryData<Listing[]>(queryKeys.listings.my(userId!));

      if (previousListings && userId) {
        queryClient.setQueryData<Listing[]>(
          queryKeys.listings.my(userId),
          previousListings.map((l) =>
            l.id === variables.id ? { ...l, bumpedAt: new Date().toISOString() } : l
          )
        );
      }

      return { previousListings };
    },
    onError: (err, variables, context) => {
      if (context?.previousListings && userId) {
        queryClient.setQueryData(queryKeys.listings.my(userId), context.previousListings);
      }
      setBumpMessage(err instanceof Error ? err.message : "Öne çıkarma başarısız oldu.");
    },
    onSuccess: (data) => {
      setBumpMessage(data.message || "İlan yenilendi!");
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.my(userId) });
      }
      router.refresh();
    },
  });

  const handleArchive = async (listingId: string) => {
    setArchiveError(null);
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) {
      setArchiveError("İlan bulunamadı. Lütfen sayfayı yenileyip tekrar dene.");
      return;
    }

    const isCurrentlyArchived = listing.status === "archived";
    archiveMutation.mutate({
      id: listingId,
      isArchived: isCurrentlyArchived,
      currentStatus: listing.status,
    });
  };

  const handleBump = async (listingId: string) => {
    setBumpMessage(null);
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) {
      setBumpMessage("İlan bulunamadı. Lütfen sayfayı yenileyip tekrar dene.");
      return;
    }

    bumpMutation.mutate({
      id: listingId,
      status: listing.status,
      bumpedAt: listing.bumpedAt,
    });
  };

  // --- Bulk Actions (Still using basic loading for simplicity in MVP) ---

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    setIsBulkArchiving(true);
    setArchiveError(null);
    try {
      const response = await ApiClient.request<{ message: string }>(
        API_ROUTES.LISTINGS.BULK_ARCHIVE,
        {
          method: "POST",
          body: JSON.stringify({ ids: selectedIds }),
          schema: apiResponseSchemas.genericMessage,
        }
      );
      if (response.success) {
        setSelectedIds([]);
        if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.listings.my(userId) });
        router.refresh();
      } else {
        setArchiveError(response.error?.message || "Toplu arşivleme sırasında hata oluştu.");
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
      const response = await ApiClient.request<{ message: string }>(
        API_ROUTES.LISTINGS.BULK_DELETE,
        {
          method: "POST",
          body: JSON.stringify({ ids: selectedIds }),
          schema: apiResponseSchemas.genericMessage,
        }
      );
      if (response.success) {
        setSelectedIds([]);
        if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.listings.my(userId) });
        router.refresh();
      } else {
        setArchiveError(response.error?.message || "Toplu silme sırasında hata oluştu.");
      }
    } catch {
      setArchiveError("Bir hata oluştu.");
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return {
    archivingId: archiveMutation.isPending ? (archiveMutation.variables?.id ?? null) : null,
    archiveError,
    setArchiveError,
    bumpingId: bumpMutation.isPending ? (bumpMutation.variables?.id ?? null) : null,
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
