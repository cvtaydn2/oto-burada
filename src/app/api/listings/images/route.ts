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

/**
 * Sanitizes filename for DISPLAY purposes only.
 * 
 * SECURITY NOTE: This does NOT provide path traversal protection.
 * Storage paths use UUIDs (buildListingImageStoragePath) and are not affected by this.
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
  return storagePath.startsWith(`listings/${userId}/`);
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.imageUpload,
    rateLimitKey: "images:upload",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik. Yükleme için .env.local dosyasını tamamlamalısın.",
      503,
    );
  }

  const formData = await request.formData();
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

  // Use the VERIFIED MIME type (from magic bytes) — not the browser-declared file.type.
  const verifiedMimeType = await getVerifiedMimeType(file);
  const contentType = verifiedMimeType ?? file.type;
  const storagePath = buildListingImageStoragePath(user.id, sanitizedFileName, verifiedMimeType ?? undefined);

  const supabase = await createSupabaseServerClient();
  const uploadResult = await supabase.storage.from(listingsBucket).upload(storagePath, file, {
    cacheControl: "86400", // 24h — UUID paths never change
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
  
  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseStorageEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase Storage ortam değişkenleri eksik. Fotoğraf silmek için .env.local dosyasını tamamlamalısın.",
      503,
    );
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
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Fotoğraf yolu geçersiz.", 400);
  }

  const { listingsBucket } = getSupabaseStorageEnv();
  const supabase = await createSupabaseServerClient();
  const removeResult = await supabase.storage.from(listingsBucket).remove([storagePath]);

  if (removeResult.error) {
    captureServerError("Image delete from storage failed", "storage", removeResult.error, {
      userId: user.id,
      storagePath,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Fotoğraf silinemedi. Lütfen tekrar dene.", 500);
  }

  return apiSuccess(null, "Fotoğraf kaldırıldı.");
}
