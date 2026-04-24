/**
 * Domain layer public surface.
 *
 * Re-exports canonical domain types and use-cases so callers can import from
 * `@/domain` instead of reaching into `@/types` or `@/services` directly.
 */

// Core entity types
export type {
  AdminModerationAction,
  Favorite,
  Listing,
  ListingCreateFormValues,
  ListingCreateInput,
  ListingFilters,
  ListingImage,
  Notification,
  Profile,
  Report,
  ReportCreateInput,
  SavedSearch,
} from "@/types";

// Use-cases
export { type FavoriteAddResult, favoriteAddUseCase } from "@/domain/usecases/favorite-add";
export {
  type FavoriteRemoveResult,
  favoriteRemoveUseCase,
} from "@/domain/usecases/favorite-remove";
export {
  type ArchiveListingResult,
  archiveListingUseCase,
} from "@/domain/usecases/listing-archive";
export { type BumpListingResult, bumpListingUseCase } from "@/domain/usecases/listing-bump";
export {
  executeListingCreation,
  type ListingCreationDependencies,
  type ListingCreationResult,
} from "@/domain/usecases/listing-create";

// Domain Logic
export { createListingEntity } from "@/domain/logic/listing-factory";
export { ListingStatusMachine } from "@/domain/logic/listing-status-machine";
export { TrustScoreCalculator } from "@/domain/logic/trust-score-calculator";
