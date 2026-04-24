import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";

export async function GET(req: Request) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;

  const user = security.user!;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "Profil bulunamadı.", 404);
    }

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    });
  } catch (error) {
    console.error("[ProfileGET] Error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Profil bilgileri alınamadı.", 500);
  }
}

export async function PATCH(req: Request) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;

  const user = security.user!;

  try {
    const body = await req.json();
    const supabase = await createSupabaseServerClient();

    // Basic sanitization/validation could happen here
    const { data, error } = await supabase
      .from("profiles")
      .update(body)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Profil güncellenemedi: " + error.message, 400);
    }

    return apiSuccess(data, "Profil başarıyla güncellendi.");
  } catch (error) {
    console.error("[ProfilePATCH] Error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Sunucu hatası.", 500);
  }
}
