import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getListingPriceHistory(listingId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("listing_price_history")
    .select("price, created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.map(item => ({
    price: item.price,
    date: item.created_at
  }));
}
