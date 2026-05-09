import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import {
  mapTicket,
  mapTicketWithProfile,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "./ticket-logic";

export async function getUserTicketsRecord(userId: string): Promise<Ticket[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, user_id, subject, description, category, priority, status, listing_id, admin_response, resolved_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTicket);
}

export async function createTicketRecord(params: {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  listingId: string | null;
}): Promise<Ticket> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_user_ticket", {
    p_subject: params.subject,
    p_description: params.description,
    p_category: params.category,
    p_priority: params.priority,
    p_listing_id: params.listingId,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to create user ticket");

  return data as unknown as Ticket;
}

export async function createPublicTicketRecord(params: {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  listingId: string | null;
}): Promise<Ticket> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_public_ticket", {
    p_subject: params.subject,
    p_description: params.description,
    p_category: params.category,
    p_priority: params.priority,
    p_listing_id: params.listingId,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to create public ticket");

  return data as unknown as Ticket;
}

export async function getAllTicketsRecord(options?: {
  status?: TicketStatus;
  limit?: number;
}): Promise<Ticket[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("tickets")
    .select(
      "id, user_id, subject, description, category, priority, status, listing_id, admin_response, resolved_at, created_at, updated_at, profiles(full_name)"
    )
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    logger.admin.error("getAllTicketsRecord error", error);
    // Fallback: without join
    const fallbackQuery = admin
      .from("tickets")
      .select(
        "id, user_id, subject, description, category, priority, status, listing_id, admin_response, resolved_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (options?.status) {
      fallbackQuery.eq("status", options.status);
    }
    if (options?.limit) {
      fallbackQuery.limit(options.limit);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) throw fallbackError;
    return (fallbackData ?? []).map(mapTicket);
  }
  return (data ?? []).map(mapTicketWithProfile);
}

export async function updateTicketStatusRecord(params: {
  ticketId: string;
  status: TicketStatus;
  adminResponse: string | null;
}): Promise<Ticket> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_update_ticket", {
    p_ticket_id: params.ticketId,
    p_status: params.status,
    p_admin_response: params.adminResponse,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to update ticket");

  return data as unknown as Ticket;
}

export async function getTicketCountRecord(): Promise<Record<TicketStatus, number>> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("tickets").select("status");

  if (error) {
    logger.admin.error("getTicketCountRecord error", error);
    return {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
  }

  const counts: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  (data ?? []).forEach((t) => {
    if (t.status && t.status in counts) {
      counts[t.status as TicketStatus]++;
    }
  });

  return counts;
}

export async function getUserEmailAndNameRecord(
  userId: string
): Promise<{ email: string | null; name: string | null }> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    const email = data?.user?.email ?? null;

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    return { email, name: (profile?.full_name as string | null) ?? null };
  } catch {
    return { email: null, name: null };
  }
}
