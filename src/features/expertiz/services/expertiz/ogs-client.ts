import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { logger } from "@/features/shared/lib/logger";

export interface OGSResponse {
  success: boolean;
  data?: {
    tramerScore: number;
    accidentCount: number;
    ownershipCount: number;
    lastKm: number;
    lastInspection: string | null;
    reportUrl?: string;
  };
  error?: string;
}

export interface VehicleHistory {
  vin: string;
  tramerScore: number;
  accidentCount: number;
  ownershipCount: number;
  lastKm: number;
  accidents: { date: string; severity: string }[];
  ownerships: { date: string; type: string }[];
  lastInspection: string | null;
}

export function getOGSApiKey(): string {
  return process.env.OGS_API_KEY ?? "";
}

export function isOGSConfigured(): boolean {
  return Boolean(process.env.OGS_API_KEY);
}

export async function queryOGS(vin: string): Promise<OGSResponse> {
  const apiKey = getOGSApiKey();

  if (!apiKey) {
    logger.expert.warn("OGS API key not configured");
    return { success: false, error: "OGS servis şu anda aktif değil." };
  }

  try {
    // Simulated OGS response for demo (replace with real API call)
    const mockResponse: VehicleHistory = {
      vin,
      tramerScore: Math.floor(Math.random() * 30) + 70,
      accidentCount: Math.floor(Math.random() * 3),
      ownershipCount: Math.floor(Math.random() * 4) + 1,
      lastKm: Math.floor(Math.random() * 150000) + 10000,
      accidents: [],
      ownerships: [],
      lastInspection: new Date().toISOString(),
    };

    logger.expert.info("OGS query completed", { vin, score: mockResponse.tramerScore });

    return {
      success: true,
      data: {
        tramerScore: mockResponse.tramerScore,
        accidentCount: mockResponse.accidentCount,
        ownershipCount: mockResponse.ownershipCount,
        lastKm: mockResponse.lastKm,
        lastInspection: mockResponse.lastInspection,
      },
    };
  } catch (err) {
    logger.expert.error("OGS query failed", err, { vin });
    return { success: false, error: "Sorgu başarısız." };
  }
}

export async function saveVehicleHistory(listingId: string, vin: string, queryResult: OGSResponse) {
  if (!queryResult.success || !queryResult.data) {
    return;
  }

  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("vehicle_history")
    .select("id")
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    await admin
      .from("vehicle_history")
      .update({
        vin,
        query_result: queryResult.data,
        tramer_details: queryResult.data,
        accident_count: queryResult.data.accidentCount,
        ownership_count: queryResult.data.ownershipCount,
        last_km: queryResult.data.lastKm,
        queried_at: new Date().toISOString(),
      })
      .eq("listing_id", listingId);
  } else {
    await admin.from("vehicle_history").insert({
      listing_id: listingId,
      vin,
      query_result: queryResult.data,
      tramer_details: queryResult.data,
      accident_count: queryResult.data.accidentCount,
      ownership_count: queryResult.data.ownershipCount,
      last_km: queryResult.data.lastKm,
    });
  }

  await admin
    .from("listings")
    .update({
      tramer_score: queryResult.data.tramerScore,
      tramer_last_query: new Date().toISOString(),
      last_inspection_date: queryResult.data.lastInspection
        ? new Date(queryResult.data.lastInspection)
        : null,
    })
    .eq("id", listingId);
}

export async function getVehicleHistoryByListing(listingId: string) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("vehicle_history")
    .select("*")
    .eq("listing_id", listingId)
    .order("queried_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.query_result as VehicleHistory;
}

export function calculateTramerScore(
  accidentCount: number,
  ownershipCount: number,
  lastKm: number
): number {
  let score = 100;

  score -= accidentCount * 15;
  score -= ownershipCount > 3 ? 10 : ownershipCount * 2;

  if (lastKm > 200000) score -= 10;
  else if (lastKm > 150000) score -= 5;

  return Math.max(0, Math.min(100, score));
}
