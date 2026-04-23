import { captureServerError } from "@/lib/monitoring/posthog-server";
import { registerFileInRegistry, verifyAndUnregisterFile } from "@/lib/storage/registry";
import { UPLOAD_POLICY } from "@/lib/storage/upload-policy";
import { getSupabaseDocumentsStorageEnv, hasSupabaseDocumentsStorageEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import {
  buildExpertDocumentStoragePath,
  createExpertDocumentSignedUrl,
  getVerifiedDocumentMimeType,
  validateExpertDocumentFile,
} from "@/services/listings/listing-documents";

/**
 * Sanitizes filename for DISPLAY purposes only.
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 200);
}

function mapUploadValidationError(message: string) {
  if (message.includes("boyutu")) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, message, 413);
  }

  if (message.includes("format")) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, message, 415);
  }

  return apiError(API_ERROR_CODES.BAD_REQUEST, message, 400);
}

async function validateDocumentUploadRequest(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      errorResponse: apiError(API_ERROR_CODES.BAD_REQUEST, "Yüklenecek belge bulunamadı.", 400),
    };
  }

  const validationError = await validateExpertDocumentFile(file);
  if (validationError) {
    return { errorResponse: mapUploadValidationError(validationError) };
  }

  return { file };
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.imageUpload,
    rateLimitKey: "documents:upload",
    maxBodySizeBytes: UPLOAD_POLICY.DOCUMENTS.MAX_FILE_SIZE_BYTES,
  });

  if (!security.ok) return security.response;

  const user = security.user!;

  if (!hasSupabaseDocumentsStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik.",
      503
    );
  }

  const validation = await validateDocumentUploadRequest(request);
  if ("errorResponse" in validation) {
    return validation.errorResponse;
  }
  const { file } = validation;

  const sanitizedFileName = sanitizeFileName(file.name);
  const { documentsBucket } = getSupabaseDocumentsStorageEnv();

  const verifiedMimeType = await getVerifiedDocumentMimeType(file);
  // Fix 5: Reject if magic bytes don't match an allowed MIME type — never fall back to declared type
  if (!verifiedMimeType) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Dosya içeriği desteklenen bir belge formatıyla eşleşmiyor.",
      415
    );
  }
  const contentType = verifiedMimeType;
  const storagePath = buildExpertDocumentStoragePath(
    user.id,
    sanitizedFileName,
    verifiedMimeType ?? undefined
  );

  const supabase = await createSupabaseServerClient();
  const uploadResult = await supabase.storage.from(documentsBucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });

  if (uploadResult.error) {
    captureServerError(
      "Document upload to storage failed",
      "storage",
      uploadResult.error,
      {
        userId: user.id,
        storagePath,
        bucket: documentsBucket,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge yüklenemedi. Lütfen tekrar dene.", 500);
  }

  // ── Register in Registry ──────────────────────────────────────────────
  try {
    await registerFileInRegistry({
      ownerId: user.id,
      bucketId: documentsBucket,
      storagePath,
      sourceEntityType: "listing_document",
      fileName: sanitizedFileName,
      fileSize: file.size,
      mimeType: contentType,
    });
  } catch (regError) {
    logger.storage.error("Failed to register document in registry, cleaning up storage", {
      error: regError,
      storagePath,
      userId: user.id,
    });
    // Cleanup storage to prevent orphan files
    await supabase.storage.from(documentsBucket).remove([storagePath]);
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Belge kaydı başarısız oldu. Lütfen tekrar dene.",
      500
    );
  }

  const signedUrl = await createExpertDocumentSignedUrl(storagePath, {
    bucketName: documentsBucket,
  });

  return apiSuccess(
    {
      document: {
        fileName: sanitizedFileName,
        // Fix 6: Use verified MIME type — never echo user-declared file.type
        mimeType: contentType,
        storagePath,
        url: signedUrl,
      },
    },
    "Belge yüklendi.",
    201
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
      503
    );
  }

  let storagePath: string | undefined;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    storagePath = typeof body.storagePath === "string" ? body.storagePath : undefined;
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Silme isteği okunamadı.", 400);
  }

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
    logger.storage.warn("Falling back to legacy prefix check for document delete", {
      storagePath,
      userId: user.id,
    });
  }

  const supabase = await createSupabaseServerClient();
  const removeResult = await supabase.storage.from(documentsBucket).remove([storagePath]);

  if (removeResult.error) {
    captureServerError(
      "Document delete from storage failed",
      "storage",
      removeResult.error,
      {
        userId: user.id,
        storagePath,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Belge silinemedi.", 500);
  }

  return apiSuccess(null, "Belge kaldırıldı.");
}
