import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * World-Class Compliance: Toxic Waste Vacuum (Issue 9)
 * KVKK/GDPR uyumluluğu için kullanım amacı bitmiş verileri HARD DELETE ile temizler.
 * (Genelde 90 gün üzerindeki Soft-Delete edilmiş veriler)
 */

export async function processComplianceVacuum() {
  const supabase = await createSupabaseServerClient();

  const now = new Date().toISOString();

  logger.system.info("Compliance: Starting data vacuum process...");

  // 1. Hard delete listings past their deletion deadline
  const { data: deletedListings, error: listError } = await supabase
    .from("listings")
    .delete()
    .lte("deletion_deadline", now)
    .select("id");

  if (listError) {
    logger.system.error("Compliance: Failed to vacuum listings", listError);
  } else if (deletedListings && deletedListings.length > 0) {
    logger.system.info(`Compliance: Vacuumed ${deletedListings.length} listings.`);
  }

  // 2. Cleanup orphaned storage objects (associated with deleted listings)
  // This would ideally be a DB trigger or a logic that lists files in storage registry
  // marked as 'archived' in Issue 7's lifecycle.

  // 3. User PII Key Shredding (Issue 4)
  // ── CRITICAL FIX: Issue COMP-VAC-01 - Only Delete Keys for Deleted Users ──────
  // Previous implementation deleted keys based solely on age, risking active user data loss.
  // Now only deletes keys for users who are marked as deleted (is_banned = true AND ban_reason contains 'Deleted').
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // First, get list of deleted user IDs
  const { data: deletedUsers } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_banned", true)
    .ilike("ban_reason", "%Account Deleted%");

  if (deletedUsers && deletedUsers.length > 0) {
    const deletedUserIds = deletedUsers.map((u) => u.id);

    const { data: shreddedKeys, error: keyError } = await supabase
      .from("user_encryption_keys")
      .delete()
      .in("user_id", deletedUserIds)
      .lte("created_at", thirtyDaysAgo)
      .select("user_id");

    if (keyError) {
      logger.system.error("Compliance: Failed to shred keys", keyError);
    } else if (shreddedKeys && shreddedKeys.length > 0) {
      logger.system.info(`Compliance: Shredded keys for ${shreddedKeys.length} deleted users.`);
    }
  } else {
    logger.system.info("Compliance: No deleted users found for key shredding.");
  }
}
