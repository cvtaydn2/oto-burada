"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

/**
 * Fetches CSRF token from the API with error handling
 * ── BUG FIX: Issue FAV-01 - Graceful CSRF Token Failure ──────────────
 * Returns null on any error instead of throwing, allowing fallback behavior
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/csrf");
    if (!response.ok) return null; // Any non-2xx status
    const payload = await response.json().catch(() => null);
    return payload?.data?.token ?? null;
  } catch {
    return null;
  }
}

async function requestFavoriteUpdate(method: "DELETE" | "POST", listingId: string) {
  const csrfToken = await fetchCsrfToken();

  // ── BUG FIX: Issue FAV-02 - Fail Fast on Missing CSRF Token ──────────────
  // If CSRF token is unavailable, throw immediately instead of sending request
  // that will be rejected. This prevents clearing user's favorites on transient errors.
  if (!csrfToken) {
    throw new Error("CSRF token alınamadı. Lütfen sayfayı yenileyin.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
  };

  const response = await fetch("/api/favorites", {
    body: JSON.stringify({ listingId }),
    headers,
    method,
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error("Sistem bakımda. Lütfen daha sonra tekrar deneyin.");
    }
    if (response.status === 401) {
      throw new Error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
    }
    if (response.status === 403) {
      throw new Error("İşlem reddedildi. Lütfen sayfayı yenileyin.");
    }
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
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const syncFavorites = async () => {
      // Eşzamanlı istekleri engelle
      if (isSyncing.current) return;
      isSyncing.current = true;

      try {
        const response = await fetch("/api/favorites", { method: "GET" });

        if (response.status === 403 || response.status === 401 || response.status === 503) {
          if (!cancelled) setRemoteFavoriteIds([]);
          return;
        }

        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { favoriteIds?: string[] };
        };

        if (!response.ok || !payload?.success) {
          if (!cancelled) setRemoteFavoriteIds(readFavoriteIds());
          return;
        }

        const serverFavoriteIds = payload?.data?.favoriteIds ?? [];
        const safeServerIds = Array.isArray(serverFavoriteIds) ? serverFavoriteIds : [];
        const localIds = readFavoriteIds();
        const localOnlyIds = localIds.filter((id) => !safeServerIds.includes(id));

        // Sadece yerelde yeni favoriler varsa POST at ve sonrasında bir kez daha doğrula
        if (localOnlyIds.length > 0) {
          await Promise.allSettled(
            localOnlyIds.map((listingId) => requestFavoriteUpdate("POST", listingId))
          );

          const finalResponse = await fetch("/api/favorites", { method: "GET" });
          const finalPayload = await finalResponse.json().catch(() => null);

          if (finalResponse.ok && finalPayload?.success) {
            const finalIds = finalPayload.data?.favoriteIds;
            if (Array.isArray(finalIds) && !cancelled) {
              broadcastFavoritesUpdate(finalIds);
              setRemoteFavoriteIds(finalIds);
              return;
            }
          }
        }

        // Değişiklik yoksa veya sync bittiyse tek seferde güncelle
        if (!cancelled) {
          broadcastFavoritesUpdate(safeServerIds);
          setRemoteFavoriteIds(safeServerIds);
        }
      } catch (_err) {
        console.error("[FavoritesProvider] Sync error:", _err);
        if (!cancelled) setRemoteFavoriteIds(readFavoriteIds());
      } finally {
        isSyncing.current = false;
      }
    };

    void syncFavorites();

    // Real-time synchronization
    const supabase = createSupabaseBrowserClient();
    const channelId = `favorites-realtime-${userId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
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
    if (remoteFavoriteIds === null) return localFavoriteIds;
    return remoteFavoriteIds;
  }, [localFavoriteIds, remoteFavoriteIds, userId]);

  const resolvedHydrated = userId ? remoteFavoriteIds !== null : localHydrated;

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

        void requestFavoriteUpdate(previousIds.includes(listingId) ? "DELETE" : "POST", listingId)
          .then((serverFavoriteIds) => {
            const safeServerIds = Array.isArray(serverFavoriteIds) ? serverFavoriteIds : [];
            setRemoteFavoriteIds(safeServerIds);
            broadcastFavoritesUpdate(safeServerIds);
          })
          .catch(() => {
            setRemoteFavoriteIds(previousIds);
            broadcastFavoritesUpdate(previousIds);
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
