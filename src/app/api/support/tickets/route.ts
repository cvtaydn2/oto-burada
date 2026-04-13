import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createTicket } from "@/services/support/ticket-service";
import type { TicketCategory, TicketPriority } from "@/services/support/ticket-service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, category, priority, listingId } = body;

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json({ error: "Subject must be at least 3 characters" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    }

    const validCategories: TicketCategory[] = ["listing", "account", "payment", "technical", "feedback", "other"];
    const validPriorities: TicketPriority[] = ["low", "medium", "high", "urgent"];

    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const ticket = await createTicket(user.id, {
      subject: subject.trim(),
      description: description.trim(),
      category: category ?? "other",
      priority: priority ?? "medium",
      listingId,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getUserTickets } = await import("@/services/support/ticket-service");
    const tickets = await getUserTickets(user.id);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
