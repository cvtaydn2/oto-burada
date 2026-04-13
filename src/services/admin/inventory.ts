"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Listing } from "@/types/domain";

export async function getAdminInventory(filters?: { status?: string; query?: string; page?: number; limit?: number }) {
  const supabase = await createSupabaseServerClient();
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 15; // Set a reasonable default for admin
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  let query = supabase
    .from("listings")
    .select("*, images:listing_images(id, listing_id, storage_path, public_url, sort_order, is_cover, placeholder_blur)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "history") {
      query = query.in("status", ["archived", "rejected"]);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.query) {
    query = query.or(`title.ilike.%${filters.query}%,brand.ilike.%${filters.query}%,model.ilike.%${filters.query}%,vin.ilike.%${filters.query}%`);
  }

  const { data, count, error } = await query.range(from, to);

  const listings = (data || []).map((listing: any) => ({
    ...listing,
    images: (listing.images || []).map((img: any) => ({
      ...img,
      url: img.public_url || "",
      order: img.sort_order || 0,
      isCover: img.is_cover || false,
    })),
  }));

  return { listings: (listings as unknown as Listing[]), total: count ?? 0, page, limit };
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
