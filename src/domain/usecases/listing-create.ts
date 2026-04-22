/**
 * Domain use-case: Create a pending listing.
 *
 * This thin orchestration layer sits between the API route and the
 * listing service. It encodes the rule that newly submitted listings
 * always start in `pending` status regardless of who submits them.
 *
 * The repository parameter makes the use-case independently testable
 * without coupling it to a specific persistence implementation.
 */
import type { Listing, ListingCreateInput } from "@/types";

export interface PendingListingCreatePayload extends ListingCreateInput {
  sellerId: string;
}

export interface ListingRepository {
  createPendingListing(input: PendingListingCreatePayload): Promise<Listing | null>;
}

export async function executeListingCreate(
  input: ListingCreateInput,
  sellerId: string,
  repository: ListingRepository
): Promise<Listing | null> {
  const payload: PendingListingCreatePayload = { ...input, sellerId };
  return repository.createPendingListing(payload);
}
