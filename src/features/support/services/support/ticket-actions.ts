"use server";

import { getAuthContext } from "@/features/auth/lib/session";
import { enqueueOutboxEvent } from "@/features/shared/services/outbox-processor";
import { getRequiredAppUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import {
  type CreateTicketInput,
  formatPublicTicketDescription,
  type Ticket,
  type TicketStatus,
} from "./ticket-logic";
import {
  createPublicTicketRecord,
  createTicketRecord,
  getAllTicketsRecord,
  getTicketCountRecord,
  getUserEmailAndNameRecord,
  getUserTicketsRecord,
  updateTicketStatusRecord,
} from "./ticket-records";

export async function getUserTickets(userId: string): Promise<Ticket[]> {
  return getUserTicketsRecord(userId);
}

export async function submitSupportTicketAction(input: CreateTicketInput): Promise<Ticket> {
  const { user } = await getAuthContext();

  if (!user) {
    throw new Error("Destek talebi göndermek için giriş yapmalısınız.");
  }

  return createTicket(user.id, input);
}

export async function createTicket(userId: string, input: CreateTicketInput): Promise<Ticket> {
  const ticket = await createTicketRecord({
    subject: input.subject,
    description: input.description,
    category: input.category,
    priority: input.priority ?? "medium",
    listingId: input.listingId ?? null,
  });

  // Outbox emailing in the background
  if (userId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { email, name } = await getUserEmailAndNameRecord(userId);
      if (email) {
        await enqueueOutboxEvent(supabase, "email_notification", {
          template: "ticket_created",
          params: {
            toEmail: email,
            toName: name ?? "Kullanıcı",
            ticketSubject: input.subject,
            ticketId: ticket.id,
          },
        });
      }
    } catch (err) {
      logger.admin.warn("Ticket created email enqueue failed", undefined, err);
    }
  }

  return ticket;
}

export async function createPublicTicket(
  input: {
    contactEmail: string;
    contactName: string;
  } & CreateTicketInput
): Promise<Ticket> {
  const formattedDescription = formatPublicTicketDescription({
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    description: input.description,
  });

  const ticket = await createPublicTicketRecord({
    subject: input.subject,
    description: formattedDescription,
    category: input.category,
    priority: input.priority ?? "medium",
    listingId: input.listingId ?? null,
  });

  try {
    const supabase = await createSupabaseServerClient();
    await enqueueOutboxEvent(supabase, "email_notification", {
      template: "ticket_created",
      params: {
        ticketId: ticket.id,
        ticketSubject: input.subject,
        ticketUrl: `${getRequiredAppUrl()}/contact`,
        toEmail: input.contactEmail,
        toName: input.contactName,
      },
    });
  } catch (err) {
    logger.admin.warn("Public ticket created email enqueue failed", undefined, err);
  }

  return ticket;
}

export async function getAllTickets(options?: {
  status?: TicketStatus;
  limit?: number;
}): Promise<Ticket[]> {
  return getAllTicketsRecord(options);
}

export async function updateSupportTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
  adminResponse?: string
): Promise<Ticket> {
  return updateTicketStatus(ticketId, status, adminResponse);
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminResponse?: string
): Promise<Ticket> {
  const ticket = await updateTicketStatusRecord({
    ticketId,
    status,
    adminResponse: adminResponse ?? null,
  });

  // If admin response exists, send email notification to the user via Outbox
  if (adminResponse && ticket.userId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { email, name } = await getUserEmailAndNameRecord(ticket.userId);
      if (email) {
        await enqueueOutboxEvent(supabase, "email_notification", {
          template: "ticket_reply",
          params: {
            toEmail: email,
            toName: name ?? "Kullanıcı",
            ticketSubject: ticket.subject,
            adminResponse,
            ticketId,
          },
        });
      }
    } catch (err) {
      logger.admin.warn("Ticket reply email enqueue failed", undefined, err);
    }
  }

  return ticket;
}

export async function getTicketCount(): Promise<Record<TicketStatus, number>> {
  return getTicketCountRecord();
}
