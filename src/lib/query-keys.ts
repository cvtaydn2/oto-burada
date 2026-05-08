// Query keys for TanStack Query
export const queryKeys = {
  listings: {
    all: ["listings"] as const,
    my: (userId: string) => ["listings", "my", userId] as const,
    detail: (id: string) => ["listings", "detail", id] as const,
  } as {
    readonly all: readonly ["listings"];
    readonly my: (userId: string) => readonly ["listings", "my", string];
    readonly detail: (id: string) => readonly ["listings", "detail", string];
  },
  listing: (id: string) => ["listings", id] as const,
  favorites: ["favorites"] as const,
  profile: ["profile"] as const,
  notifications: ["notifications"] as const,
  savedSearches: ["saved-searches"] as const,
} as const;
