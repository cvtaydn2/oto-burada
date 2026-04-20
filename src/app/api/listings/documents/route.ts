import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseDocumentsStorageEnv,
  hasSupabaseDocumentsStorageEnv,
} from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildExpertDocumentStoragePath,
  createExpertDocumentSignedUrl,
  validateExpertDocumentFile,
  getVerifiedDocumentMimeType,
} from "@/services/listings/listing-documents";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { registerFileInRegistry, verifyAndUnregisterFile } from "@/lib/storage/registry";
import { logger } from "@/lib/utils/logger";

/**
 * Sanitizes filename for DISPLAY purposes only.
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 200);
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.imageUpload,
    rateLimitKey: "documents:upload",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!;

  if (!hasSupabaseDocumentsStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik.",
      503,
    );
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

  const verifiedMimeType = await getVerifiedDocumentMimeType(file);
  const contentType = verifiedMimeType ?? file.type;
  const storagePath = buildExpertDocumentStoragePath(user.id, sanitizedFileName, verifiedMimeType ?? undefined);
  
  const supabase = await createSupabaseServerClient();
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

  // ── Register in Registry ──────────────────────────────────────────────
  await registerFileInRegistry({
    ownerId: user.id,
    bucketId: documentsBucket,
    storagePath,
    sourceEntityType: 'listing_document',
    fileName: sanitizedFileName,
    fileSize: file.size,
    mimeType: contentType,
  });

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
  // Security checks: CSRF + Auth
  const security = await withAuthAndCsrf(request);

  if (!security.ok) return security.response;
  
  const user = security.user!;

  if (!hasSupabaseDocumentsStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik.",
      503,
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Silme isteği okunamadı.", 400);
  }

  const storagePath = body?.storagePath;

  if (!storagePath) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Belge yolu eksik.", 400);
  }

  const { documentsBucket } = getSupabaseDocumentsStorageEnv();

  // ── Verify Ownership via Registry ──────────────────────────────────────
  const isOwner = await verifyAndUnregisterFile(user.id, documentsBucket, storagePath);
  
  if (!isOwner) {
    // Legacy fallback
    const isLegacyOwner = storagePath.startsWith(`documents/${user.id}/`);
    if (!isLegacyOwner) {
      return apiError(API_ERROR_CODES.FORBIDDEN, "Bu işlem için yetkiniz yok.", 403);
    }
    logger.storage.warn("Falling back to legacy prefix check for document delete", { storagePath, userId: user.id });
  }

  const supabase = await createSupabaseServerClient();
  const removeResult = await supabase.storage.from(documentsBucket).remove([storagePath]);

  if (removeResult.error) {
    captureServerError("Document delete from storage failed", "storage", removeResult.error, {
      userId: user.id,
      storagePath,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge silinemedi.", 500);
  }

  return apiSuccess(null, "Belge kaldırıldı.");
}
