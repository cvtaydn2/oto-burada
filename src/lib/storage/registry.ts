import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

export interface RegisterFileOptions {
  ownerId: string;
  bucketId: string;
  storagePath: string;
  sourceEntityType?: 'listing' | 'listing_document' | 'profile_avatar';
  sourceEntityId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Registers a file in the database tracking system.
 */
export async function registerFileInRegistry(options: RegisterFileOptions) {
  const admin = createSupabaseAdminClient();
  
  const { data, error } = await admin
    .from("storage_objects_registry")
    .upsert({
      owner_id: options.ownerId,
      bucket_id: options.bucketId,
      storage_path: options.storagePath,
      source_entity_type: options.sourceEntityType,
      source_entity_id: options.sourceEntityId,
      file_name: options.fileName,
      file_size: options.fileSize,
      mime_type: options.mimeType,
    } as unknown as Record<string, string | number | null | undefined>, { onConflict: 'bucket_id,storage_path' })
    .select()
    .single();

  if (error) {
    logger.storage.error("Failed to register file in registry", error, { ...options });
    return null;
  }

  return data;
}

/**
 * Verifies if a user owns a file and removes it from the registry.
 */
export async function verifyAndUnregisterFile(userId: string, bucketId: string, storagePath: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  // 1. Check ownership in registry
  const { data, error } = await admin
    .from("storage_objects_registry")
    .select("id, owner_id")
    .eq("bucket_id", bucketId)
    .eq("storage_path", storagePath)
    .single();

  if (error || !data) {
    logger.storage.warn("File ownership verification failed: Record not found in registry", { 
      userId, bucketId, storagePath 
    });
    return false;
  }

  if (data.owner_id !== userId) {
    logger.storage.error("Unauthorized file access attempt detected", { 
      userId, 
      actualOwnerId: data.owner_id, 
      storagePath 
    });
    return false;
  }

  // 2. Remove from registry
  const { error: deleteError } = await admin
    .from("storage_objects_registry")
    .delete()
    .eq("id", data.id);

  if (deleteError) {
    logger.storage.error("Failed to remove file from registry after verification", deleteError);
    // Continue anyway as ownership was verified
  }

  return true;
}

/**
 * Counts how many files a user has uploaded today.
 */
export async function countDailyUserUploads(userId: string): Promise<number> {
  const admin = createSupabaseAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("storage_objects_registry")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId)
    .gte("created_at", today.toISOString());

  if (error) {
    logger.storage.error("Failed to count daily uploads", error, { userId });
    return 0;
  }

  return count ?? 0;
}
