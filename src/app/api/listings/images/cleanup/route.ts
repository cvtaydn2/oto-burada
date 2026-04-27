import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withUserAndCsrfToken } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const security = await withUserAndCsrfToken(request);
  if (!security.ok) return security.response;

  try {
    const { paths } = await request.json();

    if (!Array.isArray(paths) || paths.length === 0) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Temizlenecek dosya yolu bulunamadı.");
    }

    // Limit to 50 files per cleanup request to avoid timeouts/abuse
    const sanitizedPaths = paths.slice(0, 50).filter((p) => typeof p === "string" && p.length > 0);

    if (sanitizedPaths.length === 0) {
      return apiSuccess({ deletedCount: 0 }, "Temizlenecek dosya yok.");
    }

    const admin = createSupabaseAdminClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";

    const { data, error } = await admin.storage.from(bucketName).remove(sanitizedPaths);

    if (error) {
      logger.listings.error("Background storage cleanup failed", error, { paths: sanitizedPaths });
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Dosya temizliği sırasında bir hata oluştu.");
    }

    logger.listings.info("Orphaned images cleaned up", { count: data?.length || 0 });

    return apiSuccess({ deletedCount: data?.length || 0 }, "Dosyalar temizlendi.");
  } catch (error) {
    logger.listings.error("Cleanup API exception", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem başarısız.");
  }
}
