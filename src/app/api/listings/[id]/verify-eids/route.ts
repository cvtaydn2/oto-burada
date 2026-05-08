import { API_ERROR_CODES, apiError } from "@/features/shared/lib/response";

export async function POST() {
  return apiError(
    API_ERROR_CODES.SERVICE_UNAVAILABLE,
    "E-Devlet kimlik doğrulama servisi henüz aktif değil. Yakında kullanıma açılacak.",
    503
  );
}
