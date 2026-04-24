export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorCode = "UNKNOWN_ERROR",
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: ErrorCode;
    details?: unknown;
  };
}
