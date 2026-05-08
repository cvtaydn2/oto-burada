import { z } from "zod";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withUserAndCsrf, withUserRoute } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/server";

const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^9\d{10}$/)
    .optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  avatar_url: z.string().url().optional(),
  business_name: z.string().max(200).optional(),
  business_logo_url: z.string().url().optional(),
});

export async function GET(req: Request) {
  const security = await withUserRoute(req);
  if (!security.ok) return security.response;

  const user = security.user!;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, city, district, avatar_url, business_name, business_logo_url, user_type, is_verified, created_at"
      )
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
  } catch {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Profil bulunamadı.", 404);
  }
}

export async function PATCH(req: Request) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;

  const user = security.user!;

  try {
    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .update(validatedData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Profil güncellenemedi: " + error.message, 400);
    }

    return apiSuccess(data, "Profil başarıyla güncellendi.");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçersiz veriler.", 400);
    }
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Sunucu hatası.", 500);
  }
}
