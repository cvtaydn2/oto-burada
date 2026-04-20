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
  
  // 1. Vercel Timeout Koruması: Hard Limit
  if (inputs.length > 100) {
    return { 
      success: false, 
      error: "Tek seferde en fazla 100 ilan yüklenebilir. Lütfen CSV dosyanızı bölerek yükleyin." 
    };
  }

  const user = await requireUser();
  const admin = createSupabaseAdminClient();
  
  try {
    const preparedListings = inputs.map(input => {
      return buildListingRecord(input, user.id, []); 
    });

    const rowsToInsert = preparedListings.map(mapListingToDatabaseRow);

    // 2. Chunking (Parçalı Yükleme) - RAM ve Timeout dostu
    const CHUNK_SIZE = 25;
    for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
      const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
      
      const { error: insertError } = await admin
        .from("listings")
        .insert(chunk);

      if (insertError) {
        if (insertError.code === "23505" && insertError.message?.includes("slug")) {
          throw new Error("Bazı ilanların başlıkları çakışıyor. Lütfen benzersiz başlıklar kullanın.");
        }
        logger.listings.error("Bulk Insert SQL Error", insertError, { userId: user.id, batchIndex: i });
        throw new Error(`Veritabanına yazılırken ${i}. satırda hata oluştu. İşlem durduruldu.`);
      }
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
