import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTicketReplyEmail, sendTicketCreatedEmail } from "@/services/email/email-service";
import { getRequiredAppUrl } from "@/lib/utils/env";
import { logger } from "@/lib/utils/logger";

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
  // Join'den gelen profil bilgisi (opsiyonel)
  userEmail?: string | null;
  userName?: string | null;
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
  input: CreateTicketInput,
): Promise<Ticket> {
  // Use server client (authenticated role) with security definer RPC
  // This respects RLS policies instead of bypassing them
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.rpc("create_user_ticket", {
    p_subject: input.subject,
    p_description: input.description,
    p_category: input.category,
    p_priority: input.priority ?? "medium",
    p_listing_id: input.listingId ?? null,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to create user ticket");

  const ticket = data as unknown as Ticket;

  // Kullanıcıya "talebiniz alındı" e-postası gönder (arka planda, hata olursa sessiz geç)
  if (userId) {
    getUserEmailAndName(userId)
      .then(({ email, name }) => {
        if (email) {
          sendTicketCreatedEmail({
            toEmail: email,
            toName: name ?? "Kullanıcı",
            ticketSubject: input.subject,
            ticketId: ticket.id,
          }).catch((err) => logger.admin.warn("Ticket created email failed silently", err));
        }
      })
      .catch(() => null);
  }

  return ticket;
}

export async function createPublicTicket(input: {
  contactEmail: string;
  contactName: string;
} & CreateTicketInput): Promise<Ticket> {
  // Use server client (anon role) with security definer RPC
  // This respects RLS policies instead of bypassing them with admin client
  const supabase = await createSupabaseServerClient();
  
  const description = [
    `İletişim Adı: ${input.contactName}`,
    `İletişim E-postası: ${input.contactEmail}`,
    "",
    input.description,
  ].join("\n");

  const { data, error } = await supabase.rpc("create_public_ticket", {
    p_subject: input.subject,
    p_description: description,
    p_category: input.category,
    p_priority: input.priority ?? "medium",
    p_listing_id: input.listingId ?? null,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to create public ticket");

  const ticket = data as unknown as Ticket;

  sendTicketCreatedEmail({
    ticketId: ticket.id,
    ticketSubject: input.subject,
    ticketUrl: `${getRequiredAppUrl()}/contact`,
    toEmail: input.contactEmail,
    toName: input.contactName,
  }).catch((err) => logger.admin.warn("Public ticket created email failed silently", err));

  return ticket;
}

/**
 * Get all tickets (admin-only).
 * Uses admin client because this is only called from admin dashboard.
 * RLS is bypassed intentionally for admin read operations.
 */
export async function getAllTickets(options?: {
  status?: TicketStatus;
  limit?: number;
}): Promise<Ticket[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("tickets")
    .select("*, profiles!tickets_user_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    logger.admin.error("getAllTickets error", error);
    // Fallback: join olmadan dene
    const fallbackQuery = admin
      .from("tickets")
      .select("*")
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

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminResponse?: string,
): Promise<Ticket> {
  // Use server client (authenticated admin) with security definer RPC
  // This enforces admin check inside the RPC function
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.rpc("admin_update_ticket", {
    p_ticket_id: ticketId,
    p_status: status,
    p_admin_response: adminResponse ?? null,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to update ticket");

  const ticket = data as unknown as Ticket;

  // Admin yanıt yazdıysa kullanıcıya e-posta gönder
  if (adminResponse && ticket.userId) {
    getUserEmailAndName(ticket.userId)
      .then(({ email, name }) => {
        if (email) {
          sendTicketReplyEmail({
            toEmail: email,
            toName: name ?? "Kullanıcı",
            ticketSubject: ticket.subject,
            adminResponse,
            ticketId,
          }).catch((err) => logger.admin.warn("Ticket reply email failed silently", err));
        }
      })
      .catch(() => null);
  }

  return ticket;
}

/**
 * Get ticket count by status (admin-only).
 * Uses admin client because this is only called from admin dashboard.
 * RLS is bypassed intentionally for admin read operations.
 */
export async function getTicketCount(): Promise<Record<TicketStatus, number>> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("tickets").select("status");

  if (error) {
    logger.admin.error("getTicketCount error", error);
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
    if (t.status in counts) {
      counts[t.status as TicketStatus]++;
    }
  });

  return counts;
}

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

async function getUserEmailAndName(userId: string): Promise<{ email: string | null; name: string | null }> {
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

function mapTicketWithProfile(row: Record<string, unknown>): Ticket {
  const profile = row.profiles as { full_name?: string } | null;
  return {
    ...mapTicket(row),
    userEmail: null,
    userName: profile?.full_name ?? null,
  };
}
