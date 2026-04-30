"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDatabaseNotification } from "@/services/notifications/notification-records";

interface QuestionWithListings {
  user_id: string;
  listings: {
    seller_id?: string;
    title: string;
    slug: string;
  };
}

/**
 * Ask a question on a listing
 */
export async function askQuestionAction(listingId: string, question: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Insert the question
  const { data: questionData, error: questionError } = await supabase
    .from("listing_questions")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      question,
      status: "pending",
    })
    .select("*, listings(seller_id, title, slug)")
    .single();

  if (questionError) {
    return { success: false, error: questionError.message };
  }

  // 2. Notify the seller
  const listing = (questionData as unknown as QuestionWithListings).listings;
  if (listing && listing.seller_id) {
    try {
      await createDatabaseNotification({
        userId: listing.seller_id,
        type: "question",
        title: "Yeni İlan Sorusu",
        message: `"${listing.title}" ilanın için yeni bir soru soruldu: "${question.substring(0, 50)}${question.length > 50 ? "..." : ""}"`,
        href: `/listing/${listing.slug}#sorular`,
      });
    } catch (notifyError) {
      console.error("Failed to send seller notification:", notifyError);
    }
  }

  revalidatePath(`/listing/${listing.slug}`);
  return { success: true, data: questionData };
}

/**
 * Answer a question
 */
export async function answerQuestionAction(questionId: string, answer: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Update the question with answer
  const { data: questionData, error: questionError } = await supabase
    .from("listing_questions")
    .update({
      answer,
      updated_at: new Date().toISOString(),
      status: "approved", // Auto-approve when owner answers
    })
    .eq("id", questionId)
    .select("*, listings(title, id, slug), profiles(full_name)")
    .single();

  if (questionError) {
    return { success: false, error: questionError.message };
  }

  // 2. Notify the asker
  if (questionData && questionData.user_id) {
    try {
      const listing = (questionData as unknown as QuestionWithListings).listings;
      await createDatabaseNotification({
        userId: questionData.user_id,
        type: "question",
        title: "Sorunuz Cevaplandı",
        message: `"${listing?.title}" ilanı için sorduğunuz soru cevaplandı.`,
        href: `/listing/${listing?.slug}#sorular`,
      });
    } catch (notifyError) {
      console.error("Failed to send asker notification:", notifyError);
    }
  }

  revalidatePath(`/listing/${(questionData as unknown as QuestionWithListings).listings?.slug}`);
  return { success: true, data: questionData };
}
