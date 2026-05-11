import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import type { ListingRejectReasonCode } from "@/types";
import type { Json } from "@/types/supabase";

import type { AtomicModerateListingResult } from "./listing-moderation-pure-logic";

/**
 * Fetches a listing joined with profile details using admin privileges.
 */
export async function fetchAdminListingWithProfile(listingId: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("*, seller:profiles!seller_id(*)")
    .eq("id", listingId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetches explicit metadata including contact mail for specified identity.
 */
export async function fetchSellerContactIdentity(sellerId: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const { data } = await admin.auth.admin.getUserById(sellerId);
  if (!data?.user) return null;

  return {
    email: data.user.email,
    fullName:
      (data.user.user_metadata as { full_name?: string } | undefined)?.full_name ?? "Satıcı",
  };
}

interface ExecuteAtomicModerationParams {
  listingId: string;
  status: string;
  adminUserId: string;
  note: string;
  reasonCode?: ListingRejectReasonCode | null;
  outboxPayload: Json;
  notificationPayload: Json;
}

/**
 * Executes transactional atomic moderation procedure.
 */
export async function executeAtomicModerationRpc({
  listingId,
  status,
  adminUserId,
  note,
  reasonCode,
  outboxPayload,
  notificationPayload,
}: ExecuteAtomicModerationParams): Promise<AtomicModerateListingResult | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc("atomic_moderate_listing", {
    p_listing_id: listingId,
    p_status: status,
    p_admin_id: adminUserId,
    p_note: note,
    p_reason_code: reasonCode ?? null,
    p_outbox_payload: outboxPayload,
    p_notification_payload: notificationPayload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as AtomicModerateListingResult | null;
}

/**
 * Removes related child records before terminating the listing record safely.
 */
export async function cascadeDeleteListing(listingId: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  // Explicit sequentially aligned deletions to fulfill integrity constraints without strict cascade downtime hazards
  await admin.from("listing_images").delete().eq("listing_id", listingId);
  await admin.from("favorites").delete().eq("listing_id", listingId);
  await admin.from("reports").delete().eq("listing_id", listingId);

  const { error } = await admin.from("listings").delete().eq("id", listingId);
  if (error) return false;

  return true;
}

/**
 * Removes binaries from physical storage.
 */
export async function removeStorageBinaries(bucket: string, paths: string[]) {
  if (!hasSupabaseAdminEnv()) return false;
  const admin = createSupabaseAdminClient();

  const { error } = await admin.storage.from(bucket).remove(paths);
  return !error;
}
