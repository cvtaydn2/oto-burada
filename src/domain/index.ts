/**
 * Domain layer public surface.
 *
 * Re-exports canonical domain types and use-cases so callers can import from
 * `@/domain` instead of reaching into `@/types` or `@/services` directly.
 */

// Core entity types
export type {
  AdminModerationAction,
  Chat,
  ExpertInspection,
  Favorite,
  Listing,
  ListingCreateFormValues,
  ListingCreateInput,
  ListingFilters,
  ListingImage,
  Message,
  Notification,
  Profile,
  Report,
  ReportCreateInput,
  SavedSearch,
} from "@/types";

// Use-cases
export {
  executeListingCreation,
  type ListingCreationDependencies,
  type ListingCreationResult,
} from "@/domain/usecases/listing-create";
