export { useAuth, useSupabase } from "./supabase/client";

export class ApiClient {
  static baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  static async request<T>(
    path: string,
    options: RequestInit = {},
    _schemaOrOptions?: unknown,
    _extra?: unknown
  ): Promise<T> {
    if (_schemaOrOptions || _extra) {
      // compatibility placeholders
    }
    const response = await fetch(`${ApiClient.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }

  static get<T>(path: string, _options?: unknown) {
    if (_options) {
      // compatibility placeholder
    }
    return ApiClient.request<T>(path, { method: "GET" });
  }

  static post<T>(path: string, body: unknown, _options?: unknown) {
    if (_options) {
      // compatibility placeholder
    }
    return ApiClient.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const redis = null;
export { getCachedData, invalidateCache, setCachedData } from "./redis/client";
