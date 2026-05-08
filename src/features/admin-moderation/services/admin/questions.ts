import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";

/**
 * Get pending questions for moderation
 */
export async function getPendingQuestions(limit = 50) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("listing_questions")
    .select(
      `
      *,
      profiles:user_id (
        full_name
      ),
      listings:listing_id (
        title,
        slug
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.admin.error("Error fetching pending questions", error, { limit });
    throw error;
  }

  return data || [];
}

/**
 * Get recent questions (all statuses)
 */
export async function getAllQuestions(limit = 50, offset = 0) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("listing_questions")
    .select(
      `
      *,
      profiles:user_id (
        full_name
      ),
      listings:listing_id (
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.admin.error("Error fetching all questions", error, { limit, offset });
    throw error;
  }

  return data || [];
}

/**
 * Moderate a question
 */
export async function moderateQuestion(
  questionId: string,
  status: "approved" | "rejected",
  isPublic?: boolean
) {
  const supabase = createSupabaseAdminClient();

  const updateData: {
    status: "approved" | "rejected";
    updated_at: string;
    is_public?: boolean;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (isPublic !== undefined) {
    updateData.is_public = isPublic;
  }

  const { data, error } = await supabase
    .from("listing_questions")
    .update(updateData)
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    logger.admin.error("Error moderating question", error, { questionId, status });
    throw error;
  }

  return data;
}

/**
 * Delete a question (Admin only)
 */
export async function deleteQuestion(questionId: string) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("listing_questions").delete().eq("id", questionId);

  if (error) {
    logger.admin.error("Error deleting question", error, { questionId });
    throw error;
  }

  return { success: true };
}
