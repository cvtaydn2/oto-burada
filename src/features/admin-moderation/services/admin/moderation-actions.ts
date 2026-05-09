"use server";

import { requireAdminUser } from "@/features/auth/lib/session";
import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { adminModerationActionSchema } from "@/lib/validators/admin";
import type { AdminModerationAction, ModerationAction, ModerationTargetType } from "@/types";

interface AdminModerationActionRow {
  action: ModerationAction;
  admin_user_id: string;
  created_at: string;
  id: string;
  note: string | null;
  target_id: string;
  target_type: ModerationTargetType;
}

function mapAdminActionRow(row: AdminModerationActionRow) {
  return adminModerationActionSchema.parse({
    action: row.action,
    adminUserId: row.admin_user_id,
    createdAt: row.created_at,
    id: row.id,
    note: row.note,
    targetId: row.target_id,
    targetType: row.target_type,
  });
}

export async function logAdminAction(input: {
  action: ModerationAction;
  adminUserId: string;
  note?: string | null;
  targetId: string;
  targetType: ModerationTargetType;
}) {
  await requireAdminUser();
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const timestamp = new Date().toISOString();
  const { data, error } = await admin
    .from("admin_actions")
    .insert({
      action: input.action,
      admin_user_id: input.adminUserId,
      note: input.note ?? null,
      target_id: input.targetId,
      target_type: input.targetType,
    })
    .select("id, admin_user_id, target_type, target_id, action, note, created_at")
    .single<AdminModerationActionRow>();

  if (error || !data) {
    return null;
  }

  return mapAdminActionRow({
    ...data,
    created_at: data.created_at ?? timestamp,
  });
}

export const createAdminModerationAction = logAdminAction;

export async function getRecentAdminModerationActions(limit = 8): Promise<AdminModerationAction[]> {
  await requireAdminUser();
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_actions")
    .select("id, admin_user_id, target_type, target_id, action, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AdminModerationActionRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(mapAdminActionRow);
}
