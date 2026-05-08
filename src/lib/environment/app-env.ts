/**
 * Vercel Ortam Bilgisi Yardımcı Araçları
 *
 * Bu modül, uygulamanın hangi ortamda (Local, Preview, Production) çalıştığını
 * anlamaya yardımcı olur ve ortama göre farklı davranışlar (örn: URL yönlendirmeleri)
 * sergilemesini sağlar.
 */

export type AppEnvironment = "development" | "preview" | "production";

/**
 * Mevcut çalışan ortamı döndürür.
 * Vercel üzerinde VERCEL_ENV değişkeni otomatik olarak atanır.
 */
export function getAppEnvironment(): AppEnvironment {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;

  if (env === "production") return "production";
  if (env === "preview") return "preview";
  return "development";
}

/**
 * Uygulamanın ana URL'ini döndürür.
 * Ortama göre (Production Domain, Preview URL veya Localhost) dinamik seçim yapar.
 */
export function getBaseUrl(): string {
  // 1. Manuel tanımlanmış SITE_URL (En öncelikli)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 2. Vercel Preview URL'i
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 3. Yerel geliştirme ortamı
  return "http://localhost:3000";
}

export const isProduction = getAppEnvironment() === "production";
export const isPreview = getAppEnvironment() === "preview";
export const isDevelopment = getAppEnvironment() === "development";
