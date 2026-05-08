"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { captureServerError } from "@/lib/telemetry-server";
import { Database } from "@/types/supabase";

interface SupportTicketRow {
  created_at: string;
  description: string;
  id: string;
  priority: string;
  profiles?: Array<{ full_name: string }> | { full_name: string } | null;
  status: string;
  subject: string;
}

export async function getSupportTickets() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tickets")
    .select("id, subject, description, status, priority, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    logger.admin.error("getSupportTickets query failed", error);
    captureServerError("getSupportTickets query failed", "admin", error);
    return [];
  }

  return ((data ?? []) as SupportTicketRow[]).map((ticket) => ({
    created_at: ticket.created_at,
    id: ticket.id,
    message: ticket.description,
    priority: ticket.priority,
    profile: Array.isArray(ticket.profiles) ? ticket.profiles[0] : (ticket.profiles ?? undefined),
    status: ticket.status,
    subject: ticket.subject,
  }));
}

export async function getUserEmailById(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

export async function updateTicketStatus(id: string, status: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("tickets")
    .update({
      status: status as Database["public"]["Enums"]["ticket_status"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/support");
  return { success: true };
}
