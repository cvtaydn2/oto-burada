/**
 * Domain layer public surface.
 *
 * Re-exports canonical domain types so callers can import from `@/domain`
 * instead of reaching into `@/types` or `@/services` directly.
 * This keeps the domain boundary explicit and easy to evolve.
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

// Domain guards / auth helpers
export { ensureAdmin, ensureAuthenticated, getAuthenticatedUserOrThrow } from "@/domain/guards";

// Use-cases
export type {
  ListingRepository,
  PendingListingCreatePayload,
} from "@/domain/usecases/listing-create";
export { executeListingCreate } from "@/domain/usecases/listing-create";
