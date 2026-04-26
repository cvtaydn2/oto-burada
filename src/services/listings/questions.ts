import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Get approved public questions for a listing
 */
export async function getListingQuestions(listingId: string) {
  const supabase = createSupabaseBrowserClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("listing_questions")
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `
    )
    .eq("listing_id", listingId)
    .eq("status", "approved")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error("Error fetching listing questions:", result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Get all questions for a listing (for the listing owner)
 */
export async function getOwnerListingQuestions(listingId: string) {
  const supabase = createSupabaseBrowserClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("listing_questions")
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `
    )
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error("Error fetching owner listing questions:", result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Ask a question
 */
export async function askQuestion(listingId: string, question: string) {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("listing_questions")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      question,
      status: "pending", // Requires moderation
    })
    .select()
    .single();

  if (result.error) {
    console.error("Error asking question:", result.error);
    throw result.error;
  }

  return result.data;
}

/**
 * Answer a question (Listing Owner only)
 */
export async function answerQuestion(questionId: string, answer: string) {
  const supabase = createSupabaseBrowserClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase as any)
    .from("listing_questions")
    .update({
      answer,
      updated_at: new Date().toISOString(),
      status: "approved", // Auto-approve when answered by owner
    })
    .eq("id", questionId)
    .select()
    .single();

  if (result.error) {
    console.error("Error answering question:", result.error);
    throw result.error;
  }

  return result.data;
}
