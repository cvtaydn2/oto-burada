import { NextResponse } from "next/server";
import { z } from "zod";

import { API_ERROR_CODES, apiError } from "@/lib/api/response";

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
    return {
      success: false,
      response: apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz veri formatı.", 400, {
        errors: result.error.flatten().fieldErrors,
      }),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Standard error response mapper for domain use case results.
 */
export function mapUseCaseError(errorCode: string | undefined): {
  message: string;
  status: number;
  code: string;
} {
  switch (errorCode) {
    case "VALIDATION_ERROR":
      return { message: "Doğrulama hatası.", status: 400, code: API_ERROR_CODES.BAD_REQUEST };
    case "NOT_FOUND":
      return { message: "Kayıt bulunamadı.", status: 404, code: API_ERROR_CODES.NOT_FOUND };
    case "FORBIDDEN":
      return {
        message: "Bu işlem için yetkiniz yok.",
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      };
    case "QUOTA_EXCEEDED":
    case "TRUST_GUARD_REJECTION":
      return {
        message: "Bu işlem için sınırlarınız doldu veya güvenlik kısıtlamasına takıldınız.",
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
      };
    case "SLUG_COLLISION":
      return { message: "Bu ilan zaten mevcut.", status: 409, code: API_ERROR_CODES.CONFLICT };
    case "UNAUTHORIZED":
      return {
        message: "Oturum açmanız gerekiyor.",
        status: 401,
        code: API_ERROR_CODES.UNAUTHORIZED,
      };
    default:
      return {
        message: "İşlem sırasında bir hata oluştu.",
        status: 500,
        code: API_ERROR_CODES.INTERNAL_ERROR,
      };
  }
}
