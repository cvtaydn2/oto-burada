"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { buildListingRecord, mapListingToDatabaseRow, getDatabaseListings } from "@/services/listings/listing-submissions";
import type { ListingCreateInput } from "@/types";

/**
 * Server Action for Bulk Listing Creation
 * Processes an array of validated listing inputs from the CSV parser.
 */
export async function processBulkListings(inputs: ListingCreateInput[], sellerId: string) {
  if (!hasSupabaseAdminEnv()) return { success: false, error: "Veritabanı bağlantısı yok." };
  
  const admin = createSupabaseAdminClient();
  
  try {
    // 1. Fetch current listings for slug and fraud collision checks
    // Limit to 1000 for performance during checks
    const existingListings = await getDatabaseListings({ filters: { limit: 1000 } }) ?? [];

    // 2. Map and build records
    const preparedListings = inputs.map(input => {
      return buildListingRecord(input, sellerId, existingListings);
    });

    // 3. Perform atomic bulk insert
    const { error: insertError } = await admin
      .from("listings")
      .insert(preparedListings.map(mapListingToDatabaseRow));

    if (insertError) {
      console.error("Bulk Insert SQL Error:", insertError);
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
