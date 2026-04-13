import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SellerReview {
  id: string;
  seller_id: string;
  reviewer_id: string;
  listing_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer?: {
    full_name: string;
    avatar_url?: string;
  };
}

export async function getSellerReviews(sellerId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("seller_reviews")
    .select(`
      *,
      reviewer:profiles!reviewer_id (
        full_name,
        avatar_url
      )
    `)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching seller reviews:", error);
    return [];
  }

  return data as SellerReview[];
}

export async function getSellerRatingSummary(sellerId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("seller_reviews")
    .select("rating")
    .eq("seller_id", sellerId);

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const average = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
  return { average, count: data.length };
}

export async function submitSellerReview(params: {
  seller_id: string;
  listing_id?: string;
  rating: number;
  comment?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("seller_reviews")
    .insert({
      ...params,
      reviewer_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
