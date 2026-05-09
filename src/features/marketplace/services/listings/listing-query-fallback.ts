import { logger } from "@/lib/logging/logger";

export interface LegacySchemaPreferences {
  listings: boolean;
  marketplace: boolean;
}

const legacySchemaPreferences: LegacySchemaPreferences = {
  listings: false,
  marketplace: false,
};

export function getLegacySchemaPreferences(): LegacySchemaPreferences {
  return legacySchemaPreferences;
}

export function preferLegacyListingSchema(): boolean {
  return legacySchemaPreferences.listings;
}

export function preferLegacyMarketplaceSchema(): boolean {
  return legacySchemaPreferences.marketplace;
}

export function markLegacyListingSchemaPreferred(): void {
  legacySchemaPreferences.listings = true;
}

export function markLegacyMarketplaceSchemaPreferred(): void {
  legacySchemaPreferences.marketplace = true;
}

export function isListingSchemaError(
  error: { code?: string; message?: string } | null | undefined
) {
  const message = error?.message ?? "";

  return (
    error?.code === "PGRST116" ||
    message.includes("column") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

export function isTransientFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("fetch failed") || message.includes("network");
}

export async function runQueryWithTransientRetry<T>(
  operation: () => PromiseLike<T>,
  context: string,
  retries = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientFetchError(error) || attempt === retries) {
        throw error;
      }

      logger.db.warn(`${context} transient network error, retrying`, {
        attempt: attempt + 1,
        retries,
        message: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${context} failed`);
}
