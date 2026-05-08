// Core lib exports - Minimal to avoid circular dependencies
// TODO: Gradually add exports back after resolving circular dependencies

// Basic utilities that don't have circular deps
export * from "./caching/cache";
export * from "./constants/api-routes";
export * from "./constants/domain";
export * from "./constants/doping";
export * from "./constants/drawer-heights";
export * from "./constants/plans";
export * from "./constants/ui-strings";
export * from "./constants/vehicle-categories";
export * from "./logging/logger";

// Don't re-export from environment - conflicts with domain.ts
import { logEnvValidation } from "./env-validation";
export { logEnvValidation };

export * from "./datetime/date-utils";

export function safeFormatDistanceToNow(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} gün önce`;
  if (hours > 0) return `${hours} saat önce`;
  if (minutes > 0) return `${minutes} dakika önce`;
  return "az önce";
}

// Common utilities
export * from "./query-keys";
export { cn } from "./styles/tailwind";
export * from "./utils/format";
export * from "./utils/image";

// Validators - Use named exports to avoid duplicate name conflicts
export { bulkListingActionSchema } from "./validators/admin";
export * from "./validators/admin";
export { profileSchema } from "./validators/auth";
export * from "./validators/auth";
export * from "./validators/feedback";
export * from "./validators/listing/create";
export * from "./validators/listing/fields";
export * from "./validators/listing/images";
export { listingSchema } from "./validators/listing/index";
export * from "./validators/listing/index";
export * from "./validators/listing/inspection";
export { listingFiltersSchema } from "./validators/marketplace";
export { savedSearchCreateSchema, savedSearchUpdateSchema } from "./validators/notification";
export { notificationSchema, savedSearchSchema } from "./validators/notification";
export * from "./validators/schemas";

// Monitoring
export * from "./monitoring/sentry-client";
export * from "./monitoring/telemetry-client";

// Analytics
export * from "./analytics/events";

// Security - Client safe elements only
export * from "./security/identity-number";
export {
  escapeHtml,
  sanitizeCriticalText,
  sanitizeDescription,
  sanitizeForMeta,
  sanitizeText,
} from "./security/input-sanitizer";

// Platform
export * from "./platform/maintenance";

// Storage
export * from "./storage/upload-policy";

// Sanitization
export * from "./sanitization/chat-sanitization";
export * from "./sanitization/sanitize";

// Supabase clients (should not have circular deps)
export * from "./supabase/browser";
export * from "./supabase/client";
