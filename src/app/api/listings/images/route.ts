import sharp from "sharp";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAuthAndCsrf } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerError } from "@/lib/monitoring/telemetry-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import {
  countDailyUserUploads,
  registerFileInRegistry,
  unregisterFileById,
  verifyFileOwnership,
} from "@/lib/storage/registry";
import { UPLOAD_POLICY } from "@/lib/storage/upload-policy";
import { getSupabaseStorageEnv, hasSupabaseStorageEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildListingImageStoragePath,
  getVerifiedMimeType,
  validateListingImageFile,
} from "@/services/listings/listing-images";

/**
 * Sanitizes filename for DISPLAY purposes only.
 */
function sanitizeFileName(fileName: string): string {
  // Prepend short UUID to prevent name collisions in same bucket/folder
  const uniquePrefix = crypto.randomUUID().split("-")[0];
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.+/g, ".");

  return `${uniquePrefix}-${cleanName}`.substring(0, 200);
}

function mapUploadValidationError(message: string) {
  if (message.includes("en fazla")) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, message, 413);
  }

  if (message.includes("format")) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, message, 415);
  }

  return apiError(API_ERROR_CODES.BAD_REQUEST, message, 400);
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.imageUpload,
    rateLimitKey: "images:upload",
    maxBodySizeBytes: false,
  });

  if (!security.ok) return security.response;

  const user = security.user!;

  // ── 0. Guard against Vercel Payload Limit (4.5MB) ──────────────────────
  // request.formData() will crash the process if the stream is too large.
  const contentLength = request.headers.get("content-length");
  const MAX_PAYLOAD_SIZE = UPLOAD_POLICY.IMAGES.MAX_FILE_SIZE_BYTES;
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10);
    // ── BUG FIX: Handle NaN from invalid content-length header ──
    if (Number.isNaN(parsedLength) || parsedLength > MAX_PAYLOAD_SIZE) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        `Toplam dosya boyutu ${MAX_PAYLOAD_SIZE / (1024 * 1024)}MB'dan küçük olmalıdır.`,
        413
      );
    }
  }

  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik.",
      503
    );
  }

  const formData = await request.formData();

  // ── PILL: Issue 1 - Daily Upload Limit Protection ────────────────────
  const DAILY_LIMIT = UPLOAD_POLICY.IMAGES.MAX_DAILY_UPLOADS;
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
    return mapUploadValidationError(validationError);
  }

  const sanitizedFileName = sanitizeFileName(file.name);
  const { listingsBucket } = getSupabaseStorageEnv();

  const verifiedMimeType = await getVerifiedMimeType(file);
  // Fix 5: Reject if magic bytes don't match an allowed MIME type — never fall back to declared type
  if (!verifiedMimeType) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Dosya içeriği desteklenen bir görsel formatıyla eşleşmiyor.",
      415
    );
  }
  const contentType = "image/webp"; // F07: WebP conversion
  const storagePath = buildListingImageStoragePath(
    user.id,
    sanitizedFileName.replace(/\.[^.]+$/, ".webp"), // Change extension to webp
    "image/webp"
  );

  // F07: Image Optimization Pipeline
  // - EXIF stripping (privacy)
  // - WebP conversion (performance)
  // - Resize to max 1200px (performance)
  let imageBuffer: Buffer;
  let blurhashValue: string | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const sharpInstance = sharp(Buffer.from(arrayBuffer))
      .rotate() // Auto-rotate based on orientation tag
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      });

    // Convert to WebP for better compression
    imageBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();

    // Generate blurhash for placeholder (smaller image)
    const blurImage = await sharp(Buffer.from(arrayBuffer))
      .resize(32, 32, { fit: "cover" })
      .blur(2)
      .toBuffer();

    // Simple base64 placeholder instead of blurhash (no extra dependency)
    blurhashValue = `data:image/jpeg;base64,${blurImage.toString("base64")}`;
  } catch (err) {
    logger.storage.error("Image processing failed for optimization", {
      error: err,
      userId: user.id,
    });
    // Fallback to original if processing fails
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Görsel formatı desteklenmiyor veya bozuk.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const uploadResult = await supabase.storage
    .from(listingsBucket)
    .upload(storagePath, imageBuffer, {
      cacheControl: "86400",
      contentType,
      upsert: false,
    });

  if (uploadResult.error) {
    captureServerError(
      "Image upload to storage failed",
      "storage",
      uploadResult.error,
      {
        userId: user.id,
        storagePath,
        bucket: listingsBucket,
      },
      user.id
    );
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Fotoğraf yüklenemedi. Lütfen tekrar dene.",
      500
    );
  }

  // ── Register in Registry ──────────────────────────────────────────────
  try {
    await registerFileInRegistry({
      ownerId: user.id,
      bucketId: listingsBucket,
      storagePath,
      sourceEntityType: "listing",
      fileName: sanitizedFileName,
      fileSize: imageBuffer.length,
      mimeType: contentType,
    });
  } catch (regError) {
    logger.storage.error("Failed to register image in registry, cleaning up storage", {
      error: regError,
      storagePath,
      userId: user.id,
    });
    // Cleanup storage to prevent orphan files
    await supabase.storage.from(listingsBucket).remove([storagePath]);
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Görsel kaydı başarısız oldu. Lütfen tekrar dene.",
      500
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(listingsBucket).getPublicUrl(storagePath);

  return apiSuccess(
    {
      image: {
        fileName: sanitizedFileName,
        // Fix 6: Use verified MIME type — never echo user-declared file.type
        mimeType: contentType,
        size: imageBuffer.length,
        storagePath,
        url: publicUrl,
        placeholderBlur: blurhashValue, // F07: Blur placeholder
      },
    },
    "Fotoğraf yüklendi.",
    201
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
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Fotoğraf yolu eksik.", 400);
  }

  const { listingsBucket } = getSupabaseStorageEnv();
  // ── Step 1: Verify Ownership via Registry (without unregistering yet) ──
  const registryId = await verifyFileOwnership(
    user.id,
    listingsBucket ?? "listing-images",
    storagePath
  );

  if (registryId === null) {
    logger.storage.warn("Image delete rejected because registry ownership verification failed", {
      storagePath,
      userId: user.id,
    });
    return apiError(API_ERROR_CODES.FORBIDDEN, "Bu işlem için yetkiniz yok.", 403);
  }

  // ── Step 2: Remove from Storage ────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const removeResult = await supabase.storage
    .from(listingsBucket ?? "listing-images")
    .remove([storagePath]);

  if (removeResult.error) {
    captureServerError(
      "Image delete from storage failed",
      "storage",
      removeResult.error,
      {
        userId: user.id,
        storagePath,
      },
      user.id
    );
    // Registry record is intentionally NOT removed — metadata is preserved for retry/audit.
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Fotoğraf silinemedi.", 500);
  }

  // ── Step 3: Unregister from Registry (only after storage delete succeeds) ──
  if (registryId !== null) {
    await unregisterFileById(registryId);
  }

  return apiSuccess(null, "Fotoğraf kaldırıldı.");
}
