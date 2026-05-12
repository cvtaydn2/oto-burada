import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { withCronRoute } from "@/lib/security";

/**
 * ── PILL: Issue 2 - Storage Cleanup Queue (Orphaned Files) ────────────────
 * Background job to safely delete files that were marked for deletion.
 * Prevents "Storage Hell" and ensures data consistency even if Storage API fails.
 */
export async function GET(request: Request) {
  const security = await withCronRoute(request);
  if (!security.ok) return security.response;

  const admin = createSupabaseAdminClient();

  try {
    // 1. Fetch pending cleanup tasks
    const { data: tasks, error: fetchError } = await admin
      .from("storage_cleanup_queue")
      .select("id, bucket_name, file_path, status, attempts")
      .eq("status", "pending")
      .limit(50);

    if (fetchError || !tasks) {
      logger.system.error("Storage cleanup fetch failed", fetchError);
      return NextResponse.json({ error: fetchError?.message }, { status: 500 });
    }

    const results = { success: 0, failed: 0 };

    for (const task of tasks) {
      // 2. Attempt deletion from Storage
      const { error: storageError } = await admin.storage
        .from(task.bucket_name)
        .remove([task.file_path]);

      if (storageError) {
        logger.system.error("Storage cleanup file delete failed", storageError, {
          filePath: task.file_path,
          bucketName: task.bucket_name,
        });

        // 3a. Update with retry count and error
        await admin
          .from("storage_cleanup_queue")
          .update({
            attempts: task.attempts + 1,
            last_error: storageError.message,
            status: task.attempts >= 3 ? "failed" : "pending",
          })
          .eq("id", task.id);

        results.failed++;
      } else {
        // 3b. Mark as deleted
        await admin
          .from("storage_cleanup_queue")
          .update({
            status: "deleted",
            processed_at: new Date().toISOString(),
          })
          .eq("id", task.id);

        results.success++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.system.error("Storage cleanup unexpected error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
