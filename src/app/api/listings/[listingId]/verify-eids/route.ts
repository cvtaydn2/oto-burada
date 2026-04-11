import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyListingWithEIDS } from "@/services/verification/eids-mock";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim. Lütfen giriş yapın.", 401);
  }

  try {
    const result = await verifyListingWithEIDS(listingId, user.id);
    
    if (result.success) {
      return apiSuccess(result.data, result.message);
    } else {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.message, 400);
    }
  } catch (error) {
    console.error("EIDS Verification Error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Doğrulama işlemi sırasında bir hata oluştu.", 500);
  }
}
