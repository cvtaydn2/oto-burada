import { NextResponse } from "next/server";

/**
 * Standard API response types.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard success response builder.
 */
export function apiSuccess<T>(data: T, message?: string, status = 200, headers?: HeadersInit) {
  const body: ApiSuccessResponse<T> = { success: true, data };

  if (message) {
    body.message = message;
  }

  return NextResponse.json(body, { status, headers });
}

/**
 * Standard error response builder.
 */
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  headers?: HeadersInit
) {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message },
  };

  if (details) {
    // Standardize details format to `Record<string, string[]>` for frontend compatibility.
    if (typeof details === "object" && details !== null) {
      const src = details as Record<string, unknown>;
      const sanitizedDetails: Record<string, string[]> = {};

      for (const key of Object.keys(src)) {
        const val = src[key];
        // If Zod-like field errors (array of strings), pick first message.
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
          // Truncate to avoid leaking long internal messages
          sanitizedDetails[key] = [String(val[0]).slice(0, 200)];
        } else if (typeof val === "string") {
          sanitizedDetails[key] = [val.slice(0, 200)];
        } else {
          sanitizedDetails[key] = ["Geçersiz değer"];
        }
      }

      body.error.details = sanitizedDetails;
    } else {
      // Non-object details: convert to generic structure
      body.error.details = { _general: [String(details).slice(0, 200)] };
    }
  }

  return NextResponse.json(body, { status, headers });
}

/**
 * Common error codes.
 */
export const API_ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  SERVICE_UNAVAIL: "SERVICE_UNAVAIL",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SLUG_COLLISION: "SLUG_COLLISION",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  TRUST_GUARD_REJECTION: "TRUST_GUARD_REJECTION",
  STEP_UP_REQUIRED: "STEP_UP_REQUIRED",
} as const;
