import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/session";
import { updateTicketStatus } from "@/services/support/ticket-service";
import type { TicketStatus } from "@/services/support/ticket-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = await request.json();
    const { status, adminResponse } = body;

    const validStatuses: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ticket = await updateTicketStatus(id, status ?? "in_progress", adminResponse);
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Admin ticket update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
