/**
 * Internal API Client Barrel File.
 *
 * This file re-exports all service modules to maintain backward compatibility
 * during the architectural transition. New code should preferably import
 * directly from the specific service files.
 */

export { ApiClient } from "@/lib/utils/api-client";
export { AdminService } from "@/services/admin/admin-service";
export { AuthService } from "@/services/auth/client-service";
export { FavoriteService } from "@/services/favorites/client-service";
export { NotificationService } from "@/services/notifications/client-service";
export { PaymentService } from "@/services/payments/client-service";
export { ProfileService } from "@/services/profile/client-service";
export { ReportService } from "@/services/reports/client-service";
export { SupportService } from "@/services/support/support-service";
