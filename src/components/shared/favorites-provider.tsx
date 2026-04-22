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
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
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
    const payload = (await response.json().catch(() => null)) as { error?: { message: string } };
    throw new Error(payload?.error?.message ?? "Favori durumu güncellenemedi.");
  }

  const payload = (await response.json()) as {
    success?: boolean;
    data?: { favoriteIds?: string[] };
  };
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
  const localFavoriteIds = useSyncExternalStore(subscribe, getFavoritesSnapshot, getServerSnapshot);
  const localHydrated = useSyncExternalStore(subscribe, () => true, getHydrationSnapshot);
  const [remoteFavoriteIds, setRemoteFavoriteIds] = useState<string[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const syncFavorites = async () => {
      setIsSyncing(true);
      try {
        const response = await fetch("/api/favorites", { method: "GET" });
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { favoriteIds?: string[] };
        };

        // If the initial GET fails, fall back to local state — don't corrupt remote truth.
        if (!response.ok || !payload?.success) {
          if (!cancelled) {
            setRemoteFavoriteIds(readFavoriteIds());
          }
          return;
        }

        const serverFavoriteIds = payload?.data?.favoriteIds ?? [];

        // Server is the source of truth for authenticated users.
        const safeServerIds = Array.isArray(serverFavoriteIds) ? serverFavoriteIds : [];
        const localIds = readFavoriteIds();
        const localOnlyIds = localIds.filter((id) => !safeServerIds.includes(id));

        // Upload any local-only favorites
        if (localOnlyIds.length > 0) {
          await Promise.allSettled(
            localOnlyIds.map((listingId) => requestFavoriteUpdate("POST", listingId))
          );

          // After uploads, always do a final authoritative GET — server is source of truth.
          // We do NOT merge local IDs ourselves; only confirmed server state is canonical.
          const finalResponse = await fetch("/api/favorites", { method: "GET" });
          const finalPayload = await finalResponse.json().catch(() => null);
          if (finalResponse.ok && finalPayload?.success) {
            const finalIds = finalPayload.data?.favoriteIds;
            if (Array.isArray(finalIds)) {
              if (!cancelled) {
                broadcastFavoritesUpdate(finalIds);
                setRemoteFavoriteIds(finalIds);
              }
              return;
            }
          }
          // Final GET failed — fall back to the initial server state (not local)
          if (!cancelled) {
            broadcastFavoritesUpdate(safeServerIds);
            setRemoteFavoriteIds(safeServerIds);
          }
          return;
        }

        if (!cancelled) {
          broadcastFavoritesUpdate(safeServerIds);
          setRemoteFavoriteIds(safeServerIds);
        }
      } catch {
        if (!cancelled) {
          setRemoteFavoriteIds(readFavoriteIds());
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    void syncFavorites();

    // Real-time synchronization
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`favorites-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void syncFavorites();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const resolvedFavoriteIds = useMemo(() => {
    if (!userId) return localFavoriteIds;
    // Login sonrası sync tamamlanana kadar local favorites'ı göster
    // (boş array yerine) — kullanıcı anlık "kalp boşaldı" görmez
    if (remoteFavoriteIds === null) return localFavoriteIds;
    return remoteFavoriteIds;
  }, [localFavoriteIds, remoteFavoriteIds, userId]);
  // hydrated = true only when sync is fully complete (remoteFavoriteIds set AND not mid-sync).
  // This prevents consumers from seeing a "ready" state while an initial sync is still in flight.
  const resolvedHydrated = userId ? remoteFavoriteIds !== null && !isSyncing : localHydrated;

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds: resolvedFavoriteIds,
      hydrated: resolvedHydrated,
      isAuthenticated: Boolean(userId),
      isFavorite: (listingId) =>
        Array.isArray(resolvedFavoriteIds) ? resolvedFavoriteIds.includes(listingId) : false,
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

        void requestFavoriteUpdate(previousIds.includes(listingId) ? "DELETE" : "POST", listingId)
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
    [resolvedFavoriteIds, resolvedHydrated, userId]
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
