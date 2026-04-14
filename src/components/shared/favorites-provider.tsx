"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { readFavoriteIds, writeFavoriteIds } from "@/services/favorites/favorites-storage";

interface FavoritesContextValue {
  favoriteIds: string[];
  hydrated: boolean;
  isAuthenticated: boolean;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const FAVORITES_EVENT = "oto-burada:favorites-updated";
const SERVER_SNAPSHOT: string[] = [];
const SERVER_HYDRATED = false;

let cachedFavoriteIds: string[] | null = null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(FAVORITES_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(FAVORITES_EVENT, handleChange);
  };
}

function getFavoritesSnapshot() {
  if (cachedFavoriteIds === null) {
    cachedFavoriteIds = typeof window !== "undefined" ? readFavoriteIds() : [];
  }

  return cachedFavoriteIds;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function getHydrationSnapshot() {
  return SERVER_HYDRATED;
}

async function requestFavoriteUpdate(method: "DELETE" | "POST", listingId: string) {
  const response = await fetch("/api/favorites", {
    body: JSON.stringify({ listingId }),
    headers: {
      "Content-Type": "application/json",
    },
    method,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message: string } };
    throw new Error(payload?.error?.message ?? "Favori durumu güncellenemedi.");
  }

  const payload = await response.json() as { success?: boolean; data?: { favoriteIds?: string[] } };
  return payload?.data?.favoriteIds ?? [];
}

function broadcastFavoritesUpdate(nextIds: string[]) {
  writeFavoriteIds(nextIds);
  cachedFavoriteIds = nextIds;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }
}

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { userId } = useAuthUser();
  const localFavoriteIds = useSyncExternalStore(
    subscribe,
    getFavoritesSnapshot,
    getServerSnapshot,
  );
  const localHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    getHydrationSnapshot,
  );
  const [remoteFavoriteIds, setRemoteFavoriteIds] = useState<string[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const syncFavorites = async () => {
      try {
        const response = await fetch("/api/favorites", { method: "GET" });
        const payload = await response.json().catch(() => null) as { success?: boolean; data?: { favoriteIds?: string[] } };
        const serverFavoriteIds = payload?.data?.favoriteIds ?? [];
        const localIds = readFavoriteIds();
        
        // Defensive: Ensure serverFavoriteIds is an array before filtering
        const safeServerIds = Array.isArray(serverFavoriteIds) ? serverFavoriteIds : [];
        const mergedIds = [...new Set([...safeServerIds, ...localIds])];

        if (mergedIds.length > safeServerIds.length) {
          await Promise.all(
            mergedIds
              .filter((listingId) => !safeServerIds.includes(listingId))
              .map((listingId) =>
                requestFavoriteUpdate("POST", listingId).catch(() => safeServerIds),
              ),
          );
        }

        if (!cancelled) {
          broadcastFavoritesUpdate(mergedIds);
          setRemoteFavoriteIds(mergedIds);
        }
      } catch {
        if (!cancelled) {
          setRemoteFavoriteIds(readFavoriteIds());
        }
      }
    };

    void syncFavorites();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const resolvedFavoriteIds = useMemo(
    () => (userId ? remoteFavoriteIds ?? [] : localFavoriteIds),
    [localFavoriteIds, remoteFavoriteIds, userId],
  );
  const resolvedHydrated = userId ? remoteFavoriteIds !== null && !isSyncing : localHydrated;

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds: resolvedFavoriteIds,
      hydrated: resolvedHydrated,
      isAuthenticated: Boolean(userId),
      isFavorite: (listingId) => (Array.isArray(resolvedFavoriteIds) ? resolvedFavoriteIds.includes(listingId) : false),
      toggleFavorite: (listingId) => {
        const ids = Array.isArray(resolvedFavoriteIds) ? resolvedFavoriteIds : [];
        const nextIds = ids.includes(listingId)
          ? ids.filter((id) => id !== listingId)
          : [...ids, listingId];

        if (!userId) {
          broadcastFavoritesUpdate(nextIds);
          return;
        }

        const previousIds = ids;
        setRemoteFavoriteIds(nextIds);
        broadcastFavoritesUpdate(nextIds);
        setIsSyncing(true);

        void requestFavoriteUpdate(
          previousIds.includes(listingId) ? "DELETE" : "POST",
          listingId,
        )
          .then((serverFavoriteIds) => {
            const safeServerIds = Array.isArray(serverFavoriteIds) ? serverFavoriteIds : [];
            setRemoteFavoriteIds(safeServerIds);
            broadcastFavoritesUpdate(safeServerIds);
          })
          .catch(() => {
            setRemoteFavoriteIds(previousIds);
            broadcastFavoritesUpdate(previousIds);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      },
    }),
    [resolvedFavoriteIds, resolvedHydrated, userId],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
}
