/**
 * Domain layer public surface.
 *
 * Re-exports canonical domain types so callers can import from `@/domain`
 * instead of reaching into `@/types` or `@/services` directly.
 * This keeps the domain boundary explicit and easy to evolve.
 */

// Core entity types
export type {
  Profile,
  Listing,
  ListingImage,
  ListingCreateInput,
  ListingCreateFormValues,
  Favorite,
  Report,
  ReportCreateInput,
  AdminModerationAction,
  ListingFilters,
  ExpertInspection,
  Chat,
  Message,
  Notification,
  SavedSearch,
} from "@/types";

// Domain guards / auth helpers
export { ensureAuthenticated, ensureAdmin, getAuthenticatedUserOrThrow } from "@/domain/guards";

// Use-cases
export { executeListingCreate } from "@/domain/usecases/listing-create";
export type { ListingRepository, PendingListingCreatePayload } from "@/domain/usecases/listing-create";
