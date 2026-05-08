"use server";

import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import { generateListingDescription, ListingSpecs } from "./ai-logic";

/**
 * Server Action to generate car description.
 * This ensures the API key stays on the server.
 */
export async function generateDescriptionAction(specs: ListingSpecs) {
  try {
    // 1. Check authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Oturum açmanız gerekiyor." };
    }

    // 2. Generate description
    const description = await generateListingDescription(specs);

    return { success: true, data: description };
  } catch (error) {
    logger.api.error("AI Action: Failed", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmedik bir hata oluştu.",
    };
  }
}
