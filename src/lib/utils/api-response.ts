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
    fieldErrors?: Record<string, string>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard success response builder.
 */
export function apiSuccess<T>(data: T, message?: string, status = 200) {
  const body: ApiSuccessResponse<T> = { success: true, data };

  if (message) {
    body.message = message;
  }

  return NextResponse.json(body, { status });
}

/**
 * Standard error response builder.
 */
export function apiError(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string>,
) {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message },
  };

  if (fieldErrors) {
    body.error.fieldErrors = fieldErrors;
  }

  return NextResponse.json(body, { status });
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
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
