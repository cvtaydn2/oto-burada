import { logger } from "@/lib/utils/logger";

/**
 * World-Class Integrity: Bait-and-Switch Protection (Issue 2)
 * Prevents high-SEO listings from being repurposed into completely different cars.
 */

interface ListingSnapshot {
  brand: string;
  model: string;
  view_count: number;
}

export function validateListingEdit(current: ListingSnapshot, updates: Partial<ListingSnapshot>): { 
  allowed: boolean; 
  resetStats: boolean; 
  reason?: string;
} {
  // If the listing is "Established" (e.g. > 1000 views), be very strict.
  const isEstablished = current.view_count > 1000;

  if (isEstablished) {
    if (updates.brand && updates.brand !== current.brand) {
      return { allowed: false, resetStats: false, reason: "Marka değişikliği yapılamaz." };
    }
    if (updates.model && updates.model !== current.model) {
      return { allowed: false, resetStats: false, reason: "Model değişikliği yapılamaz." };
    }
  }

  // If major changes occur in any listing, we might want to reset SEO metrics
  const majorChange = (updates.brand && updates.brand !== current.brand) || 
                      (updates.model && updates.model !== current.model);

  if (majorChange) {
    logger.market.info("Listing major change detected. Resetting SEO stats.", { current, updates });
    return { allowed: true, resetStats: true };
  }

  return { allowed: true, resetStats: false };
}
