/**
 * Internal API Client utility — the single fetch wrapper for all client-side API calls.
 *
 * Features:
 * - Consistent JSON headers
 * - Zod runtime response validation
 * - Global 401 handling with redirect deduplication guard
 * - Uniform error shape matching ApiResponse<T>
 *
 * Do NOT use this directly from components — import from the
 * specific service module instead (e.g. `@/services/favorites/client-service`).
 */

import { z } from "zod";

import { createApiResponseSchema } from "@/lib/validators/api-responses";
import type { ApiResponse } from "@/types/errors";

// Guard against multiple concurrent 401 responses causing a redirect storm.
let _isRedirecting = false;

export class ApiClient {
  static async request<T>(
    path: string,
    options?: RequestInit & { schema?: z.ZodTypeAny }
  ): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          res.status === 401 &&
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !_isRedirecting
        ) {
          _isRedirecting = true;
          window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
          setTimeout(() => {
            _isRedirecting = false;
          }, 3000);
        }

        return {
          success: false,
          error: {
            message: json.error?.message || json.error || "Bir hata oluştu.",
            code: json.error?.code || (res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR"),
            details: json.error?.details,
          },
        };
      }

      if (options?.schema) {
        const wrappedSchema = createApiResponseSchema(options.schema);
        const result = wrappedSchema.safeParse({ success: true, data: json.data });
        if (!result.success) {
          console.error("[ApiClient] Validation Error:", result.error);
          return {
            success: false,
            error: {
              message: "Sunucudan geçersiz veri geldi (Validation Error).",
              code: "VALIDATION_ERROR",
            },
          };
        }
      }

      return { success: true, data: json.data };
    } catch (err) {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Beklenmedik bir ağ hatası.",
        },
      };
    }
  }
}
