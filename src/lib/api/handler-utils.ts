import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserFacingError } from "@/config/user-messages";
import { API_ERROR_CODES, apiError } from "@/lib/response";

/**
 * Parses request JSON and validates it against a Zod schema.
 * Returns the validated data or a NextResponse error.
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz JSON verisi.", 400),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    // Normalize zod field errors into expected `Record<string, string[]>` format
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      success: false,
      response: apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz veri formatı.", 400, fieldErrors),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Standard error response mapper for domain use case results.
 * Maps internal error codes to user-friendly messages.
 */
export function mapUseCaseError(errorCode: string | undefined): {
  message: string;
  status: number;
  code: string;
} {
  switch (errorCode) {
    case "VALIDATION_ERROR":
      return {
        message: getUserFacingError("VALIDATION_ERROR"),
        status: 400,
        code: API_ERROR_CODES.BAD_REQUEST,
      };
    case "NOT_FOUND":
      return {
        message: getUserFacingError("NOT_FOUND"),
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      };
    case "FORBIDDEN":
      return {
        message: getUserFacingError("FORBIDDEN"),
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      };
    case "QUOTA_EXCEEDED":
      return {
        message: getUserFacingError("QUOTA_EXCEEDED"),
        status: 403,
        code: API_ERROR_CODES.QUOTA_EXCEEDED,
      };
    case "TRUST_GUARD_REJECTION":
      return {
        message: getUserFacingError("TRUST_GUARD_REJECTION"),
        status: 403,
        code: API_ERROR_CODES.TRUST_GUARD_REJECTION,
      };
    case "SLUG_COLLISION":
      return {
        message: getUserFacingError("SLUG_COLLISION"),
        status: 409,
        code: API_ERROR_CODES.CONFLICT,
      };
    case "UNAUTHORIZED":
      return {
        message: getUserFacingError("UNAUTHORIZED"),
        status: 401,
        code: API_ERROR_CODES.UNAUTHORIZED,
      };
    default:
      return {
        message: getUserFacingError("INTERNAL_ERROR"),
        status: 500,
        code: API_ERROR_CODES.INTERNAL_ERROR,
      };
  }
}
