"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const QUESTIONS_QUERY_TIMEOUT_MS = 2500;

function isTransientQuestionFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") || message.includes("timeout") || message.includes("network")
  );
}

// Type guard for Supabase response
function isSupabaseResponse(
  value: unknown
): value is { data: unknown; error: { code: string; message: string } | null } {
  return typeof value === "object" && value !== null && "data" in value && "error" in value;
}

// Type guard for Supabase single response
function isSupabaseSingleResponse(value: unknown): value is {
  data: unknown;
  error: { code: string; message: string } | null;
} {
  return typeof value === "object" && value !== null && "data" in value && "error" in value;
}

/**
 * Get approved public questions for a listing
 */
export async function getListingQuestions(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUESTIONS_QUERY_TIMEOUT_MS);

  let result: unknown;
  try {
    result = await supabase
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
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);
  } catch (error) {
    if (isTransientQuestionFetchError(error)) {
      return [];
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!isSupabaseResponse(result)) {
    return [];
  }

  if (result.error) {
    // Free/local environments may not have listing_questions migrated yet.
    if (result.error.code === "PGRST205" || result.error.code === "42P01") {
      return [];
    }
    console.error("Error fetching listing questions:", result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Get all questions for a listing (for the listing owner)
 */
export async function getOwnerListingQuestions(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUESTIONS_QUERY_TIMEOUT_MS);

  let result: unknown;
  try {
    result = await supabase
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
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);
  } catch (error) {
    if (isTransientQuestionFetchError(error)) {
      return [];
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!isSupabaseResponse(result)) {
    return [];
  }

  if (result.error) {
    if (result.error.code === "PGRST205" || result.error.code === "42P01") {
      return [];
    }
    console.error("Error fetching owner listing questions:", result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Ask a question
 */
export async function askQuestion(listingId: string, question: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const result = await supabase
    .from("listing_questions")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      question,
      status: "pending",
    })
    .select()
    .single();

  if (!isSupabaseSingleResponse(result)) {
    throw new Error("Invalid response from database");
  }

  if (result.error) {
    if (result.error.code === "PGRST205" || result.error.code === "42P01") {
      throw new Error("listing_questions table is not available in this environment");
    }
    console.error("Error asking question:", result.error);
    throw result.error;
  }

  return result.data;
}

/**
 * Answer a question (Listing Owner only)
 */
export async function answerQuestion(questionId: string, answer: string) {
  const supabase = await createSupabaseServerClient();

  const result = await supabase
    .from("listing_questions")
    .update({
      answer,
      updated_at: new Date().toISOString(),
      status: "approved",
    })
    .eq("id", questionId)
    .select()
    .single();

  if (!isSupabaseSingleResponse(result)) {
    throw new Error("Invalid response from database");
  }

  if (result.error) {
    if (result.error.code === "PGRST205" || result.error.code === "42P01") {
      throw new Error("listing_questions table is not available in this environment");
    }
    console.error("Error answering question:", result.error);
    throw result.error;
  }

  return result.data;
}
