import type { ListingCreateInput } from "@/types";

export interface ListingRepository {
  createPendingListing(input: any): Promise<any>;
}

export async function executeListingCreate(
  input: ListingCreateInput,
  sellerId: string,
  repository: ListingRepository,
) {
  const payload = { ...input, sellerId };
  return repository.createPendingListing(payload);
}
