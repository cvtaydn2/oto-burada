"use server";

import { revalidatePath } from "next/cache";

import { deleteQuestion, moderateQuestion } from "@/features/admin-moderation/services/questions";
import { getAuthContext } from "@/features/auth/lib/session";

export async function approveQuestionAction(questionId: string) {
  const auth = await getAuthContext();
  if (!auth.user || auth.dbProfile?.role !== "admin") {
    return { success: false, error: "Yetkilendirme başarısız." };
  }

  try {
    await moderateQuestion(questionId, "approved", true);
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return { success: false, error: message };
  }
}

export async function rejectQuestionAction(questionId: string) {
  const auth = await getAuthContext();
  if (!auth.user || auth.dbProfile?.role !== "admin") {
    return { success: false, error: "Yetkilendirme başarısız." };
  }

  try {
    await moderateQuestion(questionId, "rejected", false);
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return { success: false, error: message };
  }
}

export async function deleteQuestionAction(questionId: string) {
  const auth = await getAuthContext();
  if (!auth.user || auth.dbProfile?.role !== "admin") {
    return { success: false, error: "Yetkilendirme başarısız." };
  }

  try {
    await deleteQuestion(questionId);
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return { success: false, error: message };
  }
}
