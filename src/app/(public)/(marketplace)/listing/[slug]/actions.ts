"use server";

import { getCurrentUser } from "@/features/auth/lib/session";
import { createExpertDocumentSignedUrl } from "@/features/marketplace/services/listing-documents";
import {
  getMarketplaceListingBySlug,
  getStoredListingBySlug,
} from "@/features/marketplace/services/marketplace-listings";

/**
 * Generate signed URL for expert inspection document on-demand.
 * Public users can only access approved/public listing documents.
 * Owners/admins can access their own listing documents.
 */
export async function generateExpertDocumentSignedUrl(slug: string): Promise<string | null> {
  try {
    const publicListing = await getMarketplaceListingBySlug(slug);
    if (publicListing?.expertInspection?.documentPath) {
      return await createExpertDocumentSignedUrl(publicListing.expertInspection.documentPath);
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const storedListing = await getStoredListingBySlug(slug, { includeBanned: true });
    if (!storedListing?.expertInspection?.documentPath) {
      return null;
    }

    const isAdmin = currentUser.user_metadata?.role === "admin";
    const isOwner = currentUser.id === storedListing.sellerId;

    if (!isAdmin && !isOwner) {
      return null;
    }

    return await createExpertDocumentSignedUrl(storedListing.expertInspection.documentPath);
  } catch (error) {
    console.error("Failed to generate expert document signed URL:", error);
    return null;
  }
}
