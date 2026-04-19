"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { requireUser } from "@/lib/auth/session";
import { buildListingRecord, mapListingToDatabaseRow } from "@/services/listings/listing-submissions";
import { logger } from "@/lib/utils/logger";
import type { ListingCreateInput } from "@/types";

/**
 * Server Action for Bulk Listing Creation
 * Processes an array of validated listing inputs from the CSV parser.
 * 
 * Note: Slug collisions are handled by DB unique constraint.
 * If a collision occurs, the entire batch fails and user must fix duplicates.
 */
export async function processBulkListings(inputs: ListingCreateInput[]) {
  if (!hasSupabaseAdminEnv()) return { success: false, error: "Veritabanı bağlantısı yok." };
  const user = await requireUser();
  const admin = createSupabaseAdminClient();
  
  try {
    // Build records (slug collision handled by DB constraint)
    const preparedListings = inputs.map(input => {
      return buildListingRecord(input, user.id, []); // Empty array - no pre-check needed
    });

    // Perform atomic bulk insert
    const { error: insertError } = await admin
      .from("listings")
      .insert(preparedListings.map(mapListingToDatabaseRow));

    if (insertError) {
      // Check for slug collision
      if (insertError.code === "23505" && insertError.message?.includes("slug")) {
        return {
          success: false,
          error: "Bazı ilanların başlıkları çakışıyor. Lütfen benzersiz başlıklar kullanın.",
        };
      }
      
      logger.listings.error("Bulk Insert SQL Error", insertError, { userId: user.id, count: inputs.length });
      throw new Error("Veritabanına yazılırken bir hata oluştu.");
    }

    return { 
      success: true, 
      count: preparedListings.length,
      message: `${preparedListings.length} ilan başarıyla oluşturuldu.`
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
    return { 
      success: false, 
      error: errorMessage
    };
  }
}
