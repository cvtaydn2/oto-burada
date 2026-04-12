import { estimateVehiclePrice } from "@/services/market/price-estimation";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const brand = searchParams.get("brand");
  const model = searchParams.get("model");
  const year = Number(searchParams.get("year"));
  const mileage = Number(searchParams.get("mileage"));

  if (!brand || !model || !year || isNaN(mileage)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Eksik araç bilgileri.", 400);
  }

  try {
    const result = await estimateVehiclePrice({
      brand,
      model,
      year,
      mileage,
    });

    if (!result) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "Bu araç segmenti için yeterli veri bulunamadı.", 404);
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("Price estimation API error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Fiyat tahmini hesaplanırken bir hata oluştu.", 500);
  }
}
