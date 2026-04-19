import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getSupabaseDocumentsStorageEnv,
  hasSupabaseDocumentsStorageEnv,
} from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildExpertDocumentStoragePath,
  createExpertDocumentSignedUrl,
  validateExpertDocumentFile,
  getVerifiedDocumentMimeType,
} from "@/services/listings/listing-documents";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { isValidRequestOrigin } from "@/lib/security";

/**
 * Sanitizes filename for DISPLAY purposes only.
 * 
 * SECURITY NOTE: This does NOT provide path traversal protection.
 * Storage paths use UUIDs (buildExpertDocumentStoragePath) and are not affected by this.
 * This prevents XSS if filename is shown in UI without proper escaping.
 * 
 * @param fileName - Original filename from user upload
 * @returns Sanitized filename safe for display
 */
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
  // CSRF check - reject cross-origin requests
  if (!isValidRequestOrigin(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı (CSRF).", 403);
  }

  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:documents:upload"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseDocumentsStorageEnv()) {
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
  const { documentsBucket } = getSupabaseDocumentsStorageEnv();


  // Use verified MIME type from magic bytes — never trust browser-declared file.type
  const verifiedMimeType = await getVerifiedDocumentMimeType(file);
  const contentType = verifiedMimeType ?? file.type;
  const storagePath = buildExpertDocumentStoragePath(user.id, sanitizedFileName, verifiedMimeType ?? undefined);
  
  const uploadResult = await supabase.storage.from(documentsBucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });

  if (uploadResult.error) {
    captureServerError("Document upload to storage failed", "storage", uploadResult.error, {
      userId: user.id,
      storagePath,
      bucket: documentsBucket,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge yüklenemedi. Lütfen tekrar dene.", 500);
  }

  const signedUrl = await createExpertDocumentSignedUrl(storagePath, {
    bucketName: documentsBucket,
  });

  return apiSuccess(
    {
      document: {
        fileName: sanitizedFileName,
        mimeType: file.type,
        size: file.size,
        storagePath,
        url: signedUrl,
      },
    },
    "Belge yüklendi.",
    201,
  );
}

export async function DELETE(request: Request) {
  // CSRF check - reject cross-origin requests
  if (!isValidRequestOrigin(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı (CSRF).", 403);
  }

  if (!hasSupabaseDocumentsStorageEnv()) {
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

  const { documentsBucket } = getSupabaseDocumentsStorageEnv();
  const removeResult = await supabase.storage.from(documentsBucket).remove([storagePath]);

  if (removeResult.error) {
    captureServerError("Document delete from storage failed", "storage", removeResult.error, {
      userId: user.id,
      storagePath,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge silinemedi. Lütfen tekrar dene.", 500);
  }

  return apiSuccess(null, "Belge kaldırıldı.");
}
