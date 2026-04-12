"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { listingSchema } from "@/lib/validators";
import { buildListingRecord, mapListingToDatabaseRow, getDatabaseListings } from "@/services/listings/listing-submissions";
import type { ListingCreateInput } from "@/types";

/**
 * Server Action for Bulk Listing Creation
 * Processes an array of validated listing inputs from the CSV parser.
 */
export async function processBulkListings(inputs: any[], sellerId: string) {
  if (!hasSupabaseAdminEnv()) return { success: false, error: "Veritabanı bağlantısı yok." };
  
  const admin = createSupabaseAdminClient();
  
  try {
    // 1. Fetch current listings for slug and fraud collision checks
    // Limit to 1000 for performance during checks
    const existingListings = await getDatabaseListings({ limit: 1000 }) ?? [];

    // 2. Map and build records
    const preparedListings = inputs.map(input => {
      const createInput: ListingCreateInput = {
        title: input.title,
        brand: input.brand,
        model: input.model,
        year: Number(input.year),
        mileage: Number(input.mileage),
        fuelType: input.fuel_type.toLowerCase() as any,
        transmission: input.transmission.toLowerCase() as any,
        price: Number(input.price),
        city: input.city,
        district: input.district,
        description: input.description,
        whatsappPhone: String(input.whatsapp_phone),
        vin: input.vin,
        images: [], // Images are added later in dashboard
        tramerAmount: 0,
        damageStatusJson: {},
      };
      
      return buildListingRecord(createInput, sellerId, existingListings);
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

  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || "Beklenmedik bir hata oluştu." 
    };
  }
}
