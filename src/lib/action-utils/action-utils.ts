import { revalidatePath } from "next/cache";

import { logger } from "@/lib/logging/logger";
import { captureServerError } from "@/lib/monitoring/telemetry-server";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Standardizes server action execution.
 * Handles: Logging, Error Capture, and Path Revalidation.
 */
export async function executeServerAction<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    revalidatePaths?: string[];
    logContext?: Record<string, unknown>;
  }
): Promise<ActionResponse<T>> {
  try {
    const result = await fn();

    if (options?.revalidatePaths) {
      options.revalidatePaths.forEach((path) => revalidatePath(path));
    }

    logger.system.info(`Action Success: ${name}`, options?.logContext);

    return { success: true, data: result };
  } catch (error) {
    logger.system.error(`Action Failed: ${name}`, { error, ...options?.logContext });
    captureServerError(`Action: ${name}`, "server_action", error, options?.logContext);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmedik bir sunucu hatası oluştu.",
    };
  }
}
