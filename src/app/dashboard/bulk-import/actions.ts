"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { requireUser } from "@/lib/auth/session";
import { buildListingRecord, mapListingToDatabaseRow, getExistingListingSlugs } from "@/services/listings/listing-submissions";
import { logger } from "@/lib/utils/logger";
import type { ListingCreateInput } from "@/types";

/**
 * Server Action for Bulk Listing Creation
 * Processes an array of validated listing inputs from the CSV parser.
 */
export async function processBulkListings(inputs: ListingCreateInput[]) {
  if (!hasSupabaseAdminEnv()) return { success: false, error: "Veritabanı bağlantısı yok." };
  const user = await requireUser();
  const admin = createSupabaseAdminClient();
  
  try {
    // 1. Fetch existing slugs for collision checks (lightweight)
    const existingSlugs = await getExistingListingSlugs();

    // 2. Map and build records
    const preparedListings = inputs.map(input => {
      return buildListingRecord(input, user.id, existingSlugs);
    });

    // 3. Perform atomic bulk insert
    const { error: insertError } = await admin
      .from("listings")
      .insert(preparedListings.map(mapListingToDatabaseRow));

    if (insertError) {
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
