import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { applyDopingToListing, DopingType } from "@/services/market/doping-service";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";

export async function POST(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  try {
    const { dopingTypes } = await req.json();
    
    if (!Array.isArray(dopingTypes) || dopingTypes.length === 0) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Lütfen en az bir doping seçin.", 400);
    }

    const result = await applyDopingToListing(
      params.listingId, 
      user.id, 
      dopingTypes as DopingType[]
    );
    
    if (result.success) {
      return apiSuccess(null, result.message);
    } else {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.message, 400);
    }
  } catch (error) {
    console.error("Doping Error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
  }
}
