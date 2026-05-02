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
    if (process.env.NODE_ENV === "production") {
      // In production, only expose generic keys or nothing if it's too complex
      // For validation errors, we can send field keys but strip internal messages
      if (typeof details === "object" && details !== null) {
        const sanitizedDetails: Record<string, string[]> = {};
        for (const key of Object.keys(details as Record<string, unknown>)) {
          sanitizedDetails[key] = ["Geçersiz değer"]; // Generic message
        }
        body.error.details = sanitizedDetails;
      }
    } else {
      body.error.details = details;
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
