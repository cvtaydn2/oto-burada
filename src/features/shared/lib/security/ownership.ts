/**
 * Security Ownership Utility - Defense in Depth against IDOR (Insecure Direct Object Reference)
 *
 * This utility provides manual, redundant ownership assertions to verify that a resource
 * belongs to the currently authenticated user before performing mutations or sensitive reads.
 */

export interface OwnershipOptions {
  /**
   * The field name on the resource that contains the owner's user ID.
   * If not provided, the utility will automatically try:
   * 'seller_id', 'sellerId', 'user_id', 'userId', or 'id'.
   */
  ownerField?: string;
}

/**
 * Checks if the currently authenticated user owns the given resource.
 *
 * @param resource - The resource object to check
 * @param userId - The ID of the currently authenticated user
 * @param options - Custom configuration options
 * @returns boolean - True if the user is the owner, false otherwise
 */
export function isOwner(
  resource: Record<string, unknown> | null | undefined,
  userId: string | null | undefined,
  options: OwnershipOptions = {}
): boolean {
  if (!resource || !userId) return false;

  const field =
    options.ownerField ??
    ["seller_id", "sellerId", "user_id", "userId", "id"].find((key) => key in resource);

  if (!field) return false;

  return resource[field] === userId;
}

/**
 * Asserts that the currently authenticated user owns the given resource.
 * Throws an error if ownership verification fails.
 *
 * @param resource - The resource object to check
 * @param userId - The ID of the currently authenticated user
 * @param options - Custom configuration options
 * @throws Error if ownership verification fails
 */
export function assertOwnership(
  resource: Record<string, unknown> | null | undefined,
  userId: string | null | undefined,
  options: OwnershipOptions = {}
): void {
  if (!isOwner(resource, userId, options)) {
    throw new Error("Unauthorized: Resource ownership verification failed.");
  }
}
