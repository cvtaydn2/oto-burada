/**
 * ── UI/UX: Issue #27 - User-Facing Error Messages ─────────────
 * Centralized user-friendly error messages.
 * Maps internal error codes to clear, actionable Turkish messages.
 *
 * USAGE:
 * ```ts
 * import { getUserFacingError } from '@/config/user-messages';
 * const message = getUserFacingError('INTERNAL_ERROR');
 * ```
 */

export const USER_FACING_ERRORS: Record<string, string> = {
  // Generic Errors
  INTERNAL_ERROR: "Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
  SERVICE_UNAVAILABLE: "Servis şu anda kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.",
  SERVICE_UNAVAIL: "Servis şu anda kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.",

  // Authentication & Authorization
  UNAUTHORIZED: "Bu işlem için giriş yapmanız gerekiyor.",
  FORBIDDEN: "Bu işlem için yetkiniz bulunmuyor.",
  CSRF_ERROR:
    "Güvenlik doğrulaması başarısız oldu (CSRF). Lütfen sayfayı yenileyip tekrar deneyin.",

  // Validation
  BAD_REQUEST: "Gönderilen bilgiler geçersiz. Lütfen kontrol edip tekrar deneyin.",
  VALIDATION_ERROR: "Bazı alanlar eksik veya hatalı. Lütfen kontrol edin.",

  // Resource Errors
  NOT_FOUND: "Aradığınız kayıt bulunamadı.",
  CONFLICT: "Bu bilgilerle zaten bir kayıt mevcut.",
  SLUG_COLLISION: "Bu başlıkla zaten bir ilan mevcut. Lütfen farklı bir başlık deneyin.",

  // Rate Limiting
  RATE_LIMITED: "Çok fazla istek gönderdiniz. Lütfen birkaç dakika bekleyip tekrar deneyin.",

  // Business Logic
  QUOTA_EXCEEDED: "İlan limitinize ulaştınız. Daha fazla ilan eklemek için paketinizi yükseltin.",
  TRUST_GUARD_REJECTION:
    "Güvenlik kontrolü nedeniyle işleminiz engellenmiştir. Lütfen bilgilerinizi kontrol edin.",

  // Concurrent Operations
  CONCURRENT_UPDATE_DETECTED:
    "İlan başka bir yerden güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",

  // Database Errors (User-Friendly)
  DB_ERROR: "Veritabanı bağlantısında sorun oluştu. Lütfen daha sonra tekrar deneyin.",

  // Payment Errors
  PAYMENT_FAILED: "Ödeme işlemi başarısız oldu. Lütfen kart bilgilerinizi kontrol edin.",
  PAYMENT_TIMEOUT: "Ödeme işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.",
} as const;

/**
 * Get user-friendly error message for an error code.
 * Falls back to generic message if code is not found.
 */
export function getUserFacingError(code: string): string {
  return USER_FACING_ERRORS[code] ?? USER_FACING_ERRORS.INTERNAL_ERROR;
}

/**
 * Success messages for common operations
 */
export const USER_FACING_SUCCESS: Record<string, string> = {
  LISTING_CREATED: "İlanınız başarıyla oluşturuldu ve incelemeye gönderildi.",
  LISTING_UPDATED: "İlan bilgileriniz başarıyla güncellendi.",
  LISTING_DELETED: "İlan başarıyla silindi.",
  LISTING_ARCHIVED: "İlan arşivlendi.",

  PROFILE_UPDATED: "Profil bilgileriniz güncellendi.",
  PASSWORD_CHANGED: "Şifreniz başarıyla değiştirildi.",

  FAVORITE_ADDED: "İlan favorilere eklendi.",
  FAVORITE_REMOVED: "İlan favorilerden çıkarıldı.",

  MESSAGE_SENT: "Mesajınız gönderildi.",

  PAYMENT_SUCCESS: "Ödemeniz başarıyla alındı.",
  DOPING_ACTIVATED: "Doping paketiniz aktif edildi.",
} as const;

/**
 * Get user-friendly success message
 */
export function getUserFacingSuccess(code: string): string {
  return USER_FACING_SUCCESS[code] ?? "İşlem başarıyla tamamlandı.";
}

/**
 * Contextual help messages for specific errors
 */
export const ERROR_HELP_TEXT: Record<string, string> = {
  QUOTA_EXCEEDED:
    "Ücretsiz planda 5 ilan hakkınız bulunmaktadır. Daha fazla ilan için Premium pakete geçebilirsiniz.",
  TRUST_GUARD_REJECTION:
    "Aynı araç bilgileriyle birden fazla ilan oluşturulamaz. Farklı bir araç için yeni ilan oluşturun.",
  SLUG_COLLISION: "İlan başlığınız başka bir ilanla aynı. Daha özgün bir başlık kullanın.",
  CONCURRENT_UPDATE_DETECTED:
    "İlanınız başka bir cihazdan veya sekmeden güncellenmiş. Sayfayı yenileyerek en güncel hali görebilirsiniz.",
  RATE_LIMITED:
    "Güvenlik nedeniyle kısa sürede çok fazla işlem yapılamaz. Lütfen 1-2 dakika bekleyin.",
} as const;

/**
 * Get contextual help text for an error code
 */
export function getErrorHelpText(code: string): string | null {
  return ERROR_HELP_TEXT[code] ?? null;
}
