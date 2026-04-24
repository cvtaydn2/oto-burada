/**
 * Centralized Query Key Factory for TanStack Query.
 * Ensures consistency and safe invalidation across the app.
 */

export const queryKeys = {
  listings: {
    all: ["listings"] as const,
    lists: () => [...queryKeys.listings.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.listings.lists(), filters] as const,
    details: () => [...queryKeys.listings.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.listings.details(), id] as const,
    my: (userId: string) => [...queryKeys.listings.all, "my", userId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    byUser: (userId: string) => [...queryKeys.notifications.all, userId] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.notifications.byUser(userId), "unread-count"] as const,
  },
  profile: {
    all: ["profile"] as const,
    byUserId: (userId: string) => [...queryKeys.profile.all, userId] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    byUser: (userId: string) => [...queryKeys.favorites.all, userId] as const,
  },
  savedSearches: {
    all: ["saved-searches"] as const,
    byUser: (userId: string) => [...queryKeys.savedSearches.all, userId] as const,
  },
} as const;
