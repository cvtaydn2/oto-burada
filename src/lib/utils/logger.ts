/**
 * Structured logging utility.
 *
 * Dev:        all levels, human-readable format
 * Production: warn/error only, JSON-structured for Vercel log aggregation
 *
 * For server-side error reporting to PostHog, use captureServerError()
 * directly in server actions and API routes — do NOT import posthog-server
 * here because this file is used in both client and server contexts.
 *
 * Usage:
 *   import { logger } from "@/lib/utils/logger";
 *   logger.db.error("Query failed", error, { table: "listings" });
 *
 * For PostHog reporting in server actions:
 *   import { captureServerError } from "@/lib/monitoring/posthog-server";
 *   captureServerError("Query failed", "database", error, { table });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = process.env.NODE_ENV === "production";
const minLevel: LogLevel = isProduction ? "warn" : "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatEntry(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify(entry);
  }
  const parts = [
    `[${entry.level.toUpperCase()}]`,
    entry.context ? `[${entry.context}]` : "",
    entry.message,
  ].filter(Boolean);
  return parts.join(" ");
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  error?: unknown,
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  if (context) entry.context = context;
  if (data && Object.keys(data).length > 0) entry.data = data;
  if (error instanceof Error) {
    entry.error = {
      message: error.message,
      name: error.name,
      stack: isProduction ? undefined : error.stack,
    };
  } else if (error) {
    entry.error = { message: String(error) };
  }
  return entry;
}

function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  error?: unknown,
) {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context, data, error);
  const formatted = formatEntry(entry);

  switch (level) {
    case "debug":
      console.debug(formatted, data ?? "");
      break;
    case "info":
      console.info(formatted, data ?? "");
      break;
    case "warn":
      console.warn(formatted, entry.error ?? data ?? "");
      break;
    case "error":
      console.error(formatted, entry.error ?? data ?? "");
      break;
  }
}

export function createLogger(context: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      log("debug", message, context, data),

    info: (message: string, data?: Record<string, unknown>) =>
      log("info", message, context, data),

    warn: (message: string, data?: Record<string, unknown>, error?: unknown) =>
      log("warn", message, context, data, error),

    error: (message: string, error?: unknown, data?: Record<string, unknown>) =>
      log("error", message, context, data, error),
  };
}

/**
 * Pre-configured loggers for common contexts.
 */
export const logger = {
  auth: createLogger("auth"),
  listings: createLogger("listings"),
  reports: createLogger("reports"),
  admin: createLogger("admin"),
  storage: createLogger("storage"),
  db: createLogger("database"),
  messages: createLogger("messages"),
  payments: createLogger("payments"),
  sms: createLogger("sms"),
  notifications: createLogger("notifications"),
  settings: createLogger("settings"),
  market: createLogger("market"),
  api: createLogger("api"),
};
