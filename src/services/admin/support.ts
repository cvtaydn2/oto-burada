"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";

interface SupportTicketRow {
  created_at: string;
  description: string;
  id: string;
  priority: string;
  profiles?: Array<{ email: string; full_name: string }> | { email: string; full_name: string } | null;
  status: string;
  subject: string;
}

export async function getSupportTickets() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tickets")
    .select("id, subject, description, status, priority, created_at, profiles(full_name, email)")
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
    profile: Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles ?? undefined,
    status: ticket.status,
    subject: ticket.subject,
  }));
}

export async function updateTicketStatus(id: string, status: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/support");
  return { success: true };
}
