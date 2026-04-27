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

export class ApiClient {
  static async request<T>(
    path: string,
    options?: RequestInit & { schema?: z.ZodTypeAny }
  ): Promise<ApiResponse<T>> {
    try {
      // Automatic CSRF Token Injection (Double Submit Cookie)
      let csrfToken: string | undefined;
      if (typeof document !== "undefined") {
        csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrf_token="))
          ?.split("=")[1];
      }

      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          ...(options?.headers || {}),
        },
      });

      // ── BUG FIX: Issue BUG-04 - JSON Parse Error Handling ─────────────
      // Catch JSON parse errors separately to provide meaningful error messages
      // and prevent empty object from being validated by Zod
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch {
        return {
          success: false,
          error: {
            message: "Sunucudan geçersiz yanıt geldi (JSON parse hatası).",
            code: "PARSE_ERROR",
          },
        };
      }

      if (!res.ok) {
        const REDIRECT_FLAG_KEY = "__auth_redirect_pending";
        if (
          res.status === 401 &&
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !sessionStorage.getItem(REDIRECT_FLAG_KEY)
        ) {
          sessionStorage.setItem(REDIRECT_FLAG_KEY, "1");
          window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
        }

        const errorData = json.error as
          | { message?: string; code?: string; details?: unknown }
          | undefined;
        return {
          success: false,
          error: {
            message:
              errorData?.message ||
              (typeof json.error === "string" ? json.error : "Bir hata oluştu."),
            code:
              (errorData?.code as import("@/types/errors").ErrorCode) ||
              (res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR"),
            details: errorData?.details,
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

      return { success: true, data: json.data as T };
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
