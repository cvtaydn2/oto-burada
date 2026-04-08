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

    const json: ApiClientResponse<T> = await response.json();

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
