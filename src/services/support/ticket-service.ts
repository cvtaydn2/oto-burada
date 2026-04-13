import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "listing" | "account" | "payment" | "technical" | "feedback" | "other";

export interface Ticket {
  id: string;
  userId: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  listingId: string | null;
  adminResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  listingId?: string;
}

export async function getUserTickets(userId: string): Promise<Ticket[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTicket);
}

export async function createTicket(
  userId: string,
  input: CreateTicketInput
): Promise<Ticket> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      user_id: userId,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority ?? "medium",
      listing_id: input.listingId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTicket(data);
}

export async function getAllTickets(options?: {
  status?: TicketStatus;
  limit?: number;
}): Promise<Ticket[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("tickets")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapTicket);
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminResponse?: string
): Promise<Ticket> {
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = { status };
  if (adminResponse) {
    updates.admin_response = adminResponse;
  }
  if (status === "resolved" || status === "closed") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", ticketId)
    .select()
    .single();

  if (error) throw error;
  return mapTicket(data);
}

export async function getTicketCount(): Promise<Record<TicketStatus, number>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("status");

  if (error) throw error;

  const counts: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  (data ?? []).forEach((t) => {
    if (t.status in counts) {
      counts[t.status as TicketStatus]++;
    }
  });

  return counts;
}

function mapTicket(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    subject: row.subject as string,
    description: row.description as string,
    category: row.category as TicketCategory,
    priority: row.priority as TicketPriority,
    status: row.status as TicketStatus,
    listingId: row.listing_id as string | null,
    adminResponse: row.admin_response as string | null,
    resolvedAt: row.resolved_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
