"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const COMPARE_STORAGE_KEY = "oto-burada:compare-ids";

const MAX_COMPARE_ITEMS = 4;

function readCompareIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeCompareIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage full or unavailable
  }
}

interface CompareContextValue {
  compareIds: string[];
  hydrated: boolean;
  isInCompare: (listingId: string) => boolean;
  addToCompare: (listingId: string) => boolean;
  removeFromCompare: (listingId: string) => void;
  clearCompare: () => void;
}

type CompareProviderProps = PropsWithChildren;

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

const COMPARE_EVENT = "oto-burada:compare-updated";
const SERVER_SNAPSHOT: string[] = [];
const SERVER_HYDRATED = false;

let cachedCompareIds: string[] | null = null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(COMPARE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(COMPARE_EVENT, handleChange);
  };
}

function getCompareIdsSnapshot() {
  if (cachedCompareIds === null) {
    cachedCompareIds = typeof window !== "undefined" ? readCompareIds() : [];
  }
  return cachedCompareIds;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function getHydrationSnapshot() {
  return SERVER_HYDRATED;
}

function broadcastCompareUpdate(nextIds: string[]) {
  writeCompareIds(nextIds);
  cachedCompareIds = nextIds;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMPARE_EVENT));
  }
}

export function CompareProvider({ children }: CompareProviderProps) {
  const localCompareIds = useSyncExternalStore(subscribe, getCompareIdsSnapshot, getServerSnapshot);
  const localHydrated = useSyncExternalStore(subscribe, () => true, getHydrationSnapshot);

  const value = useMemo<CompareContextValue>(
    () => ({
      compareIds: localCompareIds,
      hydrated: localHydrated,
      isInCompare: (listingId) =>
        Array.isArray(localCompareIds) ? localCompareIds.includes(listingId) : false,
      addToCompare: (listingId) => {
        if (localCompareIds.includes(listingId)) {
          return false;
        }
        if (localCompareIds.length >= MAX_COMPARE_ITEMS) {
          return false;
        }
        const nextIds = [...localCompareIds, listingId];
        broadcastCompareUpdate(nextIds);
        return true;
      },
      removeFromCompare: (listingId) => {
        const ids = Array.isArray(localCompareIds) ? localCompareIds : [];
        const nextIds = ids.filter((id) => id !== listingId);
        broadcastCompareUpdate(nextIds);
      },
      clearCompare: () => {
        broadcastCompareUpdate([]);
      },
    }),
    [localCompareIds, localHydrated]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }

  return context;
}
