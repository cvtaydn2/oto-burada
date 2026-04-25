import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";

export async function POST(request: Request) {
  const security = await withUserAndCsrf(request);
  if (!security.ok) return security.response;

  try {
    const supabase = await createSupabaseServerClient();

    // Sign out from Supabase (clears cookies via @supabase/ssr)
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Çıkış yapılırken bir hata oluştu.", 500);
    }

    return apiSuccess({ success: true }, "Başarıyla çıkış yapıldı.");
  } catch (error) {
    console.error("[AuthSignOut] Error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Sunucu hatası.", 500);
  }
}
