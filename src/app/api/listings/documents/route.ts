import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseStorageEnv, hasSupabaseStorageEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildExpertDocumentStoragePath,
  validateExpertDocumentFile,
} from "@/services/listings/listing-documents";

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 200);
}

function userOwnsStoragePath(userId: string, storagePath: string) {
  return storagePath.startsWith(`documents/${userId}/`);
}

export async function POST(request: Request) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:documents:upload"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik. Yükleme için .env.local dosyasını tamamlamalısın.",
      503,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı. Lütfen tekrar giriş yap.", 401);
  }

  const userRateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "documents:upload"),
    rateLimitProfiles.imageUpload, // Using identical limit for now
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Yüklenecek belge bulunamadı.", 400);
  }

  const validationError = await validateExpertDocumentFile(file);

  if (validationError) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, validationError, 400);
  }

  const sanitizedFileName = sanitizeFileName(file.name);
  const { listingsBucket } = getSupabaseStorageEnv();
  const adminClient = createSupabaseAdminClient();
  const storagePath = buildExpertDocumentStoragePath(user.id, sanitizedFileName);
  
  const uploadResult = await adminClient.storage.from(listingsBucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (uploadResult.error) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge yüklenemedi. Lütfen tekrar dene.", 500);
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from(listingsBucket).getPublicUrl(storagePath);

  return apiSuccess(
    {
      document: {
        fileName: sanitizedFileName,
        mimeType: file.type,
        size: file.size,
        storagePath,
        url: publicUrl,
      },
    },
    "Belge yüklendi.",
    201,
  );
}

export async function DELETE(request: Request) {
  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik. Belge silmek için .env.local dosyasını tamamlamalısın.",
      503,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı. Lütfen tekrar giriş yap.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Silme isteği okunamadı.", 400);
  }

  const storagePath =
    typeof body === "object" && body !== null && "storagePath" in body
      ? String(body.storagePath ?? "")
      : "";

  if (!storagePath || !userOwnsStoragePath(user.id, storagePath)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Belge yolu geçersiz.", 400);
  }

  const { listingsBucket } = getSupabaseStorageEnv();
  const adminClient = createSupabaseAdminClient();
  const removeResult = await adminClient.storage.from(listingsBucket).remove([storagePath]);

  if (removeResult.error) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge silinemedi. Lütfen tekrar dene.", 500);
  }

  return apiSuccess(null, "Belge kaldırıldı.");
}
