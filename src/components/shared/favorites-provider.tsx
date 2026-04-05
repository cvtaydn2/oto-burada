"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { readFavoriteIds, writeFavoriteIds } from "@/services/favorites/favorites-storage";

interface FavoritesContextValue {
  favoriteIds: string[];
  hydrated: boolean;
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

export function FavoritesProvider({ children }: PropsWithChildren) {
  const favoriteIds = useSyncExternalStore(
    subscribe,
    getFavoritesSnapshot,
    getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    getHydrationSnapshot,
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      hydrated,
      isFavorite: (listingId) => favoriteIds.includes(listingId),
      toggleFavorite: (listingId) => {
        const nextIds = favoriteIds.includes(listingId)
          ? favoriteIds.filter((id) => id !== listingId)
          : [...favoriteIds, listingId];

        writeFavoriteIds(nextIds);
        cachedFavoriteIds = nextIds;

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(FAVORITES_EVENT));
        }
      },
    }),
    [favoriteIds, hydrated],
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
