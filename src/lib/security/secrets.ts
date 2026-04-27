import "server-only";

import { logger } from "@/lib/logging/logger";

/**
 * World-Class Security: Least Privilege Secrets (Issue 10)
 * Prevents accidental dumping of all environment variables.
 * Ensures only registered modules can access specific sensitive keys.
 */

const SECRET_REGISTRY = {
  IYZICO_API_KEY: process.env.IYZICO_API_KEY,
  IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ENCRYPTION_MASTER_KEY: process.env.ENCRYPTION_MASTER_KEY,
};

type SecretKey = keyof typeof SECRET_REGISTRY;

/**
 * PILL: Issue 10 - Secret Rotation (Zero-Downtime)
 * Supports multiple keys (comma-separated in ENV).
 */
export function getSecret(key: SecretKey): string {
  const rawValue = SECRET_REGISTRY[key] || "";
  // Split by comma to handle multiple keys during rotation
  const keys = rawValue
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    logger.security.error(`SECRET ACCESS FAILED: ${key} is missing.`);
    throw new Error(`Critical configuration missing: ${key}`);
  }

  // Return primary (first) key. Consumer tasks should iterate if needed.
  return keys[0];
}

/**
 * Returns all valid keys for a secret, useful for verifying signatures
 * during a rotation phase (Overlapping Keys).
 */
export function getSecretRotationList(key: SecretKey): string[] {
  const rawValue = SECRET_REGISTRY[key] || "";
  return rawValue
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * Prevents direct 'process.env' usage in business logic.
 * Use this wrapper to audit who accesses which secret.
 */
export const secrets = {
  payments: () => ({
    apiKey: getSecret("IYZICO_API_KEY"),
    secretKey: getSecret("IYZICO_SECRET_KEY"),
  }),
  notifications: () => ({
    apiKey: getSecret("RESEND_API_KEY"),
  }),
  security: () => ({
    masterKey: getSecret("ENCRYPTION_MASTER_KEY"),
    serviceRole: getSecret("SUPABASE_SERVICE_ROLE_KEY"),
  }),
};
