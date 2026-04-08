// Domain-level type aliases for core entities
// This provides a single source of domain types that can be used across services
// while still sharing the underlying TS types defined in src/types/domain.ts

export type UserProfile = import("@/types").Profile;
export type DomainListing = import("@/types").Listing;
export type DomainListingImage = import("@/types").ListingImage;
export type DomainListingCreateInput = import("@/types").ListingCreateInput;
export type DomainListingCreateFormValues = import("@/types").ListingCreateFormValues;
export type DomainFavorite = import("@/types").Favorite;
export type DomainReport = import("@/types").Report;
export type DomainReportCreateInput = import("@/types").ReportCreateInput;
export type DomainAdminModerationAction = import("@/types").AdminModerationAction;
export type DomainListingFilters = import("@/types").ListingFilters;

// Expose a compact namespace-like surface for potential future domain helpers
export {};
