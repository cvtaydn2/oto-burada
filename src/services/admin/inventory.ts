import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Listing } from "@/types/domain";

export async function getAdminInventory(filters?: { status?: string; query?: string }) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from("listings")
    .select("*, images:listing_images(*)")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.query) {
    query = query.or(`title.ilike.%${filters.query}%,brand.ilike.%${filters.query}%,model.ilike.%${filters.query}%,vin.ilike.%${filters.query}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin inventory:", error);
    return [];
  }

  return data as Listing[];
}

export async function forceActionOnListing(listingId: string, action: "archive" | "delete" | "approve" | "reject") {
    const supabase = await createSupabaseServerClient();
    
    if (action === "delete") {
        const { error } = await supabase.from("listings").delete().eq("id", listingId);
        if (error) throw error;
        return { success: true };
    }

    const statusMap = {
        archive: "archived",
        approve: "approved",
        reject: "rejected"
    };

    const { error } = await supabase
        .from("listings")
        .update({ status: statusMap[action as keyof typeof statusMap] })
        .eq("id", listingId);

    if (error) throw error;
    return { success: true };
}
