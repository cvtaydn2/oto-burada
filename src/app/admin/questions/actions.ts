"use server";

import { revalidatePath } from "next/cache";

import { deleteQuestion, moderateQuestion } from "@/services/admin/questions";

export async function approveQuestionAction(questionId: string) {
  try {
    await moderateQuestion(questionId, "approved", true);
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return { success: false, error: message };
  }
}

export async function rejectQuestionAction(questionId: string) {
  try {
    await moderateQuestion(questionId, "rejected", false);
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return { success: false, error: message };
  }
}

export async function deleteQuestionAction(questionId: string) {
  try {
    await deleteQuestion(questionId);
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return { success: false, error: message };
  }
}
