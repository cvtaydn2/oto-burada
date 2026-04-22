export interface ApiClientSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiClientErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

export type ApiClientResponse<T = unknown> = ApiClientSuccessResponse<T> | ApiClientErrorResponse;

export async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data?: T; error?: string; fieldErrors?: Record<string, string> }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // 204 No Content veya boş body durumunda JSON parse etme
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      if (!response.ok) {
        return { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      return {};
    }

    // Content-Type kontrolü — JSON değilse parse etme
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      if (!response.ok) {
        return { error: `HTTP ${response.status}: Beklenmeyen yanıt formatı (${contentType || "unknown"})` };
      }
      return { error: "Sunucu JSON yanıt döndürmedi." };
    }

    let json: ApiClientResponse<T>;
    try {
      json = await response.json();
    } catch {
      return { error: "Sunucu yanıtı okunamadı (JSON parse hatası)." };
    }

    if (!response.ok) {
      return {
        error: json && typeof json === "object" && "error" in json && json.error?.message
          ? json.error.message
          : `HTTP ${response.status}: ${response.statusText}`,
        fieldErrors: json && typeof json === "object" && "error" in json ? json.error?.fieldErrors : undefined,
      };
    }

    if (!json.success) {
      return {
        error: json.error.message,
        fieldErrors: json.error.fieldErrors,
      };
    }

    return { data: json.data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar dene.",
    };
  }
}

export function getApiErrorMessage(result: { error?: string }): string {
  return result.error ?? "Bir hata oluştu. Lütfen tekrar dene.";
}
