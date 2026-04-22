import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

/**
 * ── PILL: Issue 5 - BOLA / Audit Logging ──────────────────────────
 * Provides mandatory observability for sensitive data access.
 * If an admin or user accesses private data, we record the "Who, When, and Where".
 */
export async function logAuditAction(params: {
  userId?: string;
  action: "READ_PRIVATE_PROFILE" | "UPDATE_SENSITIVE_FIELD" | "DELETE_LISTING_ADMIN" | "VIEW_FINANCIAL_RECORDS";
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  ua?: string;
}) {
  const admin = createSupabaseAdminClient();

  try {
    const { error } = await admin.from("audit_logs").insert({
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      metadata: params.metadata || {},
      ip_address: params.ip,
      user_agent: params.ua
    });

    if (error) {
      logger.security.error("Failed to log audit action", error, {
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      });
    }
  } catch (err) {
    logger.security.error("Unexpected audit log error", err, {
      action: params.action,
      resourceType: params.resourceType,
    });
  }
}
