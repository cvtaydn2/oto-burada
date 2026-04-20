import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseStorageEnv, hasSupabaseStorageEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildListingImageStoragePath,
  getVerifiedMimeType,
  validateListingImageFile,
} from "@/services/listings/listing-images";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { registerFileInRegistry, verifyAndUnregisterFile, countDailyUserUploads } from "@/lib/storage/registry";
import { logger } from "@/lib/utils/logger";

/**
 * Sanitizes filename for DISPLAY purposes only.
 */
function sanitizeFileName(fileName: string): string {
  // Prepend short UUID to prevent name collisions in same bucket/folder
  const uniquePrefix = crypto.randomUUID().split("-")[0];
  const cleanName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".");
  
  return `${uniquePrefix}-${cleanName}`.substring(0, 200);
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.imageUpload,
    rateLimitKey: "images:upload",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!;

  // ── 0. Guard against Vercel Payload Limit (4.5MB) ──────────────────────
  // request.formData() will crash the process if the stream is too large.
  const contentLength = request.headers.get("content-length");
  const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB limit
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST, 
      "Toplam dosya boyutu 5MB'dan küçük olmalıdır.", 
      413
    );
  }

  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik.",
      503,
    );
  }

  const formData = await request.formData();

  // ── PILL: Issue 1 - Daily Upload Limit Protection ────────────────────
  const DAILY_LIMIT = 50;
  const currentUploadCount = await countDailyUserUploads(user.id);
  if (currentUploadCount >= DAILY_LIMIT) {
    return apiError(
      API_ERROR_CODES.RATE_LIMITED, 
      `Günlük fotoğraf yükleme limitine (${DAILY_LIMIT}) ulaştınız. Lütfen yarın tekrar deneyin.`,
      429
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Yüklenecek fotoğraf bulunamadı.", 400);
  }

  const validationError = await validateListingImageFile(file);
  if (validationError) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, validationError, 400);
  }

  const sanitizedFileName = sanitizeFileName(file.name);
  const { listingsBucket } = getSupabaseStorageEnv();

  const verifiedMimeType = await getVerifiedMimeType(file);
  const contentType = verifiedMimeType ?? file.type;
  const storagePath = buildListingImageStoragePath(user.id, sanitizedFileName, verifiedMimeType ?? undefined);

  const supabase = await createSupabaseServerClient();
  const uploadResult = await supabase.storage.from(listingsBucket).upload(storagePath, file, {
    cacheControl: "86400",
    contentType,
    upsert: false,
  });

  if (uploadResult.error) {
    captureServerError("Image upload to storage failed", "storage", uploadResult.error, {
      userId: user.id,
      storagePath,
      bucket: listingsBucket,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Fotoğraf yüklenemedi. Lütfen tekrar dene.", 500);
  }

  // ── Register in Registry ──────────────────────────────────────────────
  await registerFileInRegistry({
    ownerId: user.id,
    bucketId: listingsBucket,
    storagePath,
    sourceEntityType: 'listing',
    fileName: sanitizedFileName,
    fileSize: file.size,
    mimeType: contentType,
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from(listingsBucket).getPublicUrl(storagePath);

  return apiSuccess(
    {
      image: {
        fileName: sanitizedFileName,
        mimeType: file.type,
        size: file.size,
        storagePath,
        url: publicUrl,
      },
    },
    "Fotoğraf yüklendi.",
    201,
  );
}

export async function DELETE(request: Request) {
  // Security checks: CSRF + Auth
  const security = await withAuthAndCsrf(request);

  if (!security.ok) return security.response;
  
  const user = security.user!;

  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik.",
      503,
    );
  }

  let storagePath: string | undefined;
  try {
    const body = await request.json() as Record<string, unknown>;
    storagePath = typeof body.storagePath === 'string' ? body.storagePath : undefined;
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Silme isteği okunamadı.", 400);
  }

  if (!storagePath) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Fotoğraf yolu eksik.", 400);
  }

  const { listingsBucket } = getSupabaseStorageEnv();
  // ── Verify Ownership via Registry ──────────────────────────────────────
  const isOwner = await verifyAndUnregisterFile(user.id, listingsBucket ?? 'listing-images', storagePath);
  
  if (!isOwner) {
    // Legacy fallback
    const isLegacyOwner = storagePath.startsWith(`listings/${user.id}/`);
    if (!isLegacyOwner) {
      return apiError(API_ERROR_CODES.FORBIDDEN, "Bu işlem için yetkiniz yok.", 403);
    }
    logger.storage.warn("Falling back to legacy prefix check for image delete", { storagePath, userId: user.id });
  }

  const supabase = await createSupabaseServerClient();
  const removeResult = await supabase.storage.from(listingsBucket ?? 'listing-images').remove([storagePath]);

  if (removeResult.error) {
    captureServerError("Image delete from storage failed", "storage", removeResult.error, {
      userId: user.id,
      storagePath,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Fotoğraf silinemedi.", 500);
  }

  return apiSuccess(null, "Fotoğraf kaldırıldı.");
}
