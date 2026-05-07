"use server";

import { requireUser } from "@/features/auth/lib/session";
import {
  buildListingRecord,
  mapListingToDatabaseRow,
} from "@/features/marketplace/services/listing-submissions";
import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { hasSupabaseAdminEnv } from "@/features/shared/lib/env";
import { logger } from "@/features/shared/lib/logger";
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
      error: "Tek seferde en fazla 100 ilan yüklenebilir. Lütfen CSV dosyanızı bölerek yükleyin.",
    };
  }

  const user = await requireUser();
  const admin = createSupabaseAdminClient();

  let succeededCount = 0;
  const chunkErrors: string[] = [];

  try {
    const preparedListings = inputs.map((input) => {
      return buildListingRecord(input, user.id, []);
    });

    const rowsToInsert = preparedListings.map(mapListingToDatabaseRow);

    // 2. Chunking (Parçalı Yükleme) - RAM ve Timeout dostu
    const CHUNK_SIZE = 25;
    for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
      const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);

      const { error: insertError } = await admin.from("listings").insert(chunk);

      if (insertError) {
        let msg = `Satır ${i + 1}-${Math.min(i + CHUNK_SIZE, rowsToInsert.length)}: `;

        if (insertError.code === "23505" && insertError.message?.includes("slug")) {
          msg += "Başlık çakışması (aynı başlıkta başka bir ilan var).";
        } else {
          msg += insertError.message || "Veritabanı hatası.";
        }

        chunkErrors.push(msg);
        logger.listings.error("Bulk Insert Chunk Error", insertError, {
          userId: user.id,
          batchIndex: i,
        });
      } else {
        succeededCount += chunk.length;
      }
    }

    if (chunkErrors.length > 0) {
      return {
        success: succeededCount > 0,
        count: succeededCount,
        error: `Yükleme tamamlandı ama bazı hatalar oluştu:\n${chunkErrors.join("\n")}`,
        partial: true,
      };
    }

    return {
      success: true,
      count: succeededCount,
      message: `${succeededCount} ilan başarıyla oluşturuldu.`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
