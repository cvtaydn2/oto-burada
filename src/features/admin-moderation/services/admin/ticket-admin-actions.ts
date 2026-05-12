"use server";

import { requireAdminUser } from "@/features/auth/lib/session";
import { updateSupportTicketStatusAction } from "@/features/support/services/support/ticket-actions";
import type { TicketStatus } from "@/features/support/services/support/ticket-logic";

export async function updateAdminTicketStatusAction(params: {
  ticketId: string;
  status: TicketStatus;
  adminResponse?: string;
}) {
  await requireAdminUser();

  return updateSupportTicketStatusAction(params.ticketId, params.status, params.adminResponse);
}
