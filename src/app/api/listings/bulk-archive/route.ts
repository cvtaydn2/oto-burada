import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz ilan listesi.", 400);
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim", 401);
    }

    // Bulk update filtered by user_id for security
    const { error } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .in("id", ids)
      .eq("seller_id", user.id);

    if (error) {
       console.error("Bulk Archive Error:", error);
       return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
    }

    return apiSuccess({ count: ids.length }, `${ids.length} ilan başarıyla arşive kaldırıldı.`);
  } catch {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Beklenmedik bir hata.", 500);
  }
}
