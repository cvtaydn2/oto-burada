"use server";

import { createExpertDocumentSignedUrl } from "@/services/listings/listing-documents";

/**
 * Generate signed URL for expert inspection document on-demand.
 * This avoids generating signed URLs during initial page render (saves 100-300ms).
 *
 * @param documentPath - The storage path of the expert inspection document
 * @returns The signed URL or null if generation failed
 */
export async function generateExpertDocumentSignedUrl(
  documentPath: string
): Promise<string | null> {
  try {
    const signedUrl = await createExpertDocumentSignedUrl(documentPath);
    return signedUrl;
  } catch (error) {
    console.error("Failed to generate expert document signed URL:", error);
    return null;
  }
}
