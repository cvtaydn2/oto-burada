export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "SERVICE_UNAVAIL"
  | "CONFLICT"
  | "SLUG_COLLISION"
  | "QUOTA_EXCEEDED"
  | "TRUST_GUARD_REJECTION"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
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
