"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getSupportTickets() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("support_tickets")
    .select("*, profile:profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return data;
}

export async function updateTicketStatus(id: string, status: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/support");
  return { success: true };
}
