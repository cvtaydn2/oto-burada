"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export interface PlateLookupResult {
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  transmission: string;
  source: "suggestion";
}

/**
 * Builds a non-authoritative vehicle suggestion from plate format.
 * This is helper/autofill only and MUST NOT be treated as official registry validation.
 */
export async function lookupVehicleByPlate(
  plate: string,
  supabaseClient?: SupabaseClient
): Promise<PlateLookupResult | null> {
  // Rate limit: 10 lookups per hour per IP to prevent abuse of the DB lookup
  let ip = "unknown";
  try {
    const headersList = await headers();
    ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? headersList.get("x-real-ip")
      ?? "unknown";
  } catch {
    ip = "local";
  }
  const rateLimit = await checkRateLimit(`plate-lookup:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    logger.listings.warn("Plate lookup rate limited", { ip });
    return null;
  }

  const normalizedPlate = plate.replace(/\s/g, "").toUpperCase();
  
  // Basic TR Plate Regex
  const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])(([A-Z])(\d{4,5})|([A-Z]{2})(\d{3,4})|([A-Z]{3})(\d{2,3}))$/;
  
  if (!plateRegex.test(normalizedPlate)) {
    return null;
  }

  // Simulate network delay for realistic experience
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    let supabase = supabaseClient;
    
    if (!supabase) {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      supabase = await createSupabaseServerClient();
    }

    // Fetch a random brand from live DB
    const { data: brands } = await supabase
      .from("brands")
      .select("id, name")
      .limit(20);

    if (!brands || brands.length === 0) return null;

    // Use plate characters to deterministically pick a brand from live DB
    const brandIndex = normalizedPlate.length % brands.length;
    const selectedBrand = brands[brandIndex];

    // Fetch models for this specific brand from live DB
    const { data: models } = await supabase
      .from("models")
      .select("name")
      .eq("brand_id", selectedBrand.id)
      .limit(10);

    if (!models || models.length === 0) return null;

    const modelIndex = (normalizedPlate.charCodeAt(normalizedPlate.length - 1)) % models.length;
    const selectedModel = models[modelIndex];

  // Build a deterministic suggestion using live marketplace reference data.
  // This is intentionally NOT an official registry result.
    return {
      brand: selectedBrand.name,
      model: selectedModel.name,
      year: 2020 + (normalizedPlate.length % 5), // Deterministic year based on plate
      fuelType: "benzin",
      transmission: "otomatik",
      source: "suggestion",
    };
  } catch (error) {
    logger.listings.error("Plate lookup failed", error, { plate });
    return null;
  }
}
