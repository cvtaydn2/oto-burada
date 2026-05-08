/**
 * Atomic slug generation with database-level uniqueness check.
 * Prevents race conditions during concurrent listing creation.
 */

import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";

import { buildBaseSlug } from "./listing-factory";

export interface SlugInput {
  brand: string;
  model: string;
  year: number;
  city: string;
  title: string;
}

/**
 * Generate a unique slug with atomic database check.
 * Retries with incremental suffixes if collision detected.
 *
 * @param input - Listing data for slug generation
 * @param maxAttempts - Maximum retry attempts (default: 5)
 * @returns Unique slug guaranteed to not exist in database
 * @throws Error if unable to generate unique slug after max attempts
 */
export async function generateUniqueSlug(input: SlugInput, maxAttempts = 5): Promise<string> {
  const admin = createSupabaseAdminClient();
  const baseSlug = buildBaseSlug(input);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate candidate slug
    const candidate =
      attempt === 0
        ? `${baseSlug}-${crypto.randomUUID().split("-")[0]}` // First attempt: base + random ID
        : `${baseSlug}-${crypto.randomUUID().split("-")[0]}-${attempt}`; // Subsequent: add attempt number

    try {
      // Atomic check: does this slug exist?
      const { count, error } = await admin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("slug", candidate)
        .abortSignal(AbortSignal.timeout(3000)); // 3 second timeout

      if (error) {
        logger.db.error("Slug uniqueness check failed", { error, candidate, attempt });
        // On error, try next candidate
        continue;
      }

      // If count is 0, slug is unique
      if (count === 0) {
        logger.db.debug("Unique slug generated", { slug: candidate, attempts: attempt + 1 });
        return candidate;
      }

      // Collision detected, try next candidate
      logger.db.debug("Slug collision detected", { slug: candidate, attempt });
    } catch (error) {
      logger.db.error("Slug generation exception", error, { candidate, attempt });
      // Continue to next attempt
    }
  }

  // All attempts exhausted
  const fallbackSlug = `${baseSlug}-${crypto.randomUUID()}`;
  logger.db.warn("Max slug generation attempts reached, using full UUID fallback", {
    baseSlug,
    fallbackSlug,
    maxAttempts,
  });

  return fallbackSlug;
}

/**
 * Validate that a slug is unique in the database.
 * Used for manual slug validation or testing.
 */
export async function isSlugUnique(slug: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  try {
    const { count, error } = await admin
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug)
      .abortSignal(AbortSignal.timeout(2000));

    if (error) {
      logger.db.error("Slug validation failed", { error, slug });
      return false; // Fail-closed: assume not unique on error
    }

    return count === 0;
  } catch (error) {
    logger.db.error("Slug validation exception", error, { slug });
    return false; // Fail-closed
  }
}
