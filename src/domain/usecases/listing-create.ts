import type { ListingCreateInput } from "@/types";

export interface PendingListingCreatePayload extends ListingCreateInput {
  sellerId: string;
}

export interface ListingRepository {
  createPendingListing(input: PendingListingCreatePayload): Promise<unknown>;
}

export async function executeListingCreate(
  input: ListingCreateInput,
  sellerId: string,
  repository: ListingRepository,
) {
  const payload = { ...input, sellerId };
  return repository.createPendingListing(payload);
}
