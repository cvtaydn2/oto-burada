export const API_ROUTES = {
  LISTINGS: {
    BASE: "/api/listings",
    DETAIL: (id: string) => `/api/listings/${id}`,
    ARCHIVE: (id: string) => `/api/listings/${id}/archive`,
    BUMP: (id: string) => `/api/listings/${id}/bump`,
    BULK_ARCHIVE: "/api/listings/bulk-archive",
    BULK_DELETE: "/api/listings/bulk-delete",
    BULK_DRAFT: "/api/listings/bulk-draft",
  },
  ADMIN: {
    USERS: {
      DETAIL: (id: string) => `/api/admin/users/${id}`,
    },
    LISTINGS: {
      MODERATE: (id: string) => `/api/admin/listings/${id}/moderate`,
    },
  },
  NOTIFICATIONS: {
    BASE: "/api/notifications",
  },
  SUPPORT: {
    TICKETS: "/api/support/tickets",
  },
  FAVORITES: "/api/favorites",
} as const;
