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
  // User profile details from joins
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

export function formatPublicTicketDescription(input: {
  contactName: string;
  contactEmail: string;
  description: string;
}): string {
  return [
    `İletişim Adı: ${input.contactName}`,
    `İletişim E-postası: ${input.contactEmail}`,
    "",
    input.description,
  ].join("\n");
}

export function mapTicket(row: Record<string, unknown>): Ticket {
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

export function mapTicketWithProfile(row: Record<string, unknown>): Ticket {
  const profile = row.profiles as { full_name?: string } | null;
  return {
    ...mapTicket(row),
    userEmail: null,
    userName: profile?.full_name ?? null,
  };
}
