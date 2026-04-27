/**
 * API Mutation Security Enforcement Test
 *
 * ── SECURITY FIX: Issue SEC-API-01 - Mutation Route Protection ──
 * Ensures all POST, PUT, PATCH, DELETE route files under src/app/api
 * use approved security wrappers or are explicitly allowlisted.
 *
 * This test prevents future developers from accidentally creating
 * unprotected mutation endpoints.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const API_DIR = join(process.cwd(), "src/app/api");

// Approved security wrappers
const SECURITY_WRAPPERS = [
  "withSecurity",
  "withUserRoute",
  "withUserAndCsrf",
  "withUserAndCsrfToken",
  "withAdminRoute",
  "withCronOrAdmin",
  "withCsrfToken",
  "withAuth",
  "withAuthAndCsrf",
];

// Allowlisted routes with documented reasons
const ALLOWLISTED_ROUTES: Record<string, string> = {
  // Webhook routes - have their own signature verification
  "payments/webhook/route.ts": "Iyzico webhook signature verification",

  // Callback routes - handle external payment redirects
  "payments/callback/route.ts": "Payment callback with token verification",

  // Public contact form - has Turnstile + rate limiting + spam detection
  "contact/route.ts": "Public contact with Turnstile + rate limit",

  // Disabled endpoints - return 503 immediately
  "listings/[id]/verify-eids/route.ts": "Disabled endpoint - returns 503",

  // Cron routes - protected by withCronOrAdmin or CRON_SECRET
  "cron/main/route.ts": "Cron with CRON_SECRET verification",
  "cron/cleanup-stale-payments/route.ts": "Cron with CRON_SECRET verification",
  "cron/cleanup-storage/route.ts": "Cron with CRON_SECRET verification",
  "cron/expire-dopings/route.ts": "Cron with CRON_SECRET verification",
  "cron/expire-listings/route.ts": "Cron with CRON_SECRET verification",
  "cron/expire-reservations/route.ts": "Cron with CRON_SECRET verification",
  "cron/outbox/route.ts": "Cron with CRON_SECRET verification",
  "cron/process-fulfillment-jobs/route.ts": "Cron with CRON_SECRET verification",
  "cron/sync-listing-views/route.ts": "Cron with CRON_SECRET verification",
  "saved-searches/notify/route.ts": "Cron with CRON_SECRET verification",

  // Health check - public read endpoint
  "health/route.ts": "Public health check (GET only)",
};

function findRouteFiles(dir: string): string[] {
  const routeFiles: string[] = [];

  if (!existsSync(dir)) {
    return routeFiles;
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      routeFiles.push(...findRouteFiles(fullPath));
    } else if (entry.name === "route.ts") {
      routeFiles.push(fullPath);
    }
  }

  return routeFiles;
}

function extractRouteRelativePath(fullPath: string): string {
  const apiIndex = fullPath.indexOf("/api/");
  if (apiIndex === -1) return fullPath;
  return fullPath.slice(apiIndex + 5); // Remove "/api/" prefix
}

describe("API Mutation Security Enforcement", () => {
  it("all mutation routes must use security wrappers or be allowlisted", () => {
    const routeFiles = findRouteFiles(API_DIR);
    const violations: string[] = [];

    for (const file of routeFiles) {
      const content = readFileSync(file, "utf-8");
      const routePath = extractRouteRelativePath(file);

      // Check if file has mutation exports
      const hasMutation = /export async function (POST|PUT|DELETE|PATCH)\s*\(/.test(content);

      if (!hasMutation) {
        continue; // Only check mutation routes
      }

      // Check if file uses any security wrapper
      const hasSecurityWrapper = SECURITY_WRAPPERS.some((wrapper) => content.includes(wrapper));

      // Check if route is allowlisted
      const isAllowlisted = Object.keys(ALLOWLISTED_ROUTES).some((allowed) =>
        routePath.endsWith(allowed)
      );

      // Check if all mutations just return error (disabled endpoint)
      const allMutationsDisabled = (
        content.match(/export async function (POST|PUT|DELETE|PATCH)/g) || []
      ).every((match) => {
        // Find the function body and check if it immediately returns error
        const funcMatch = content.match(
          new RegExp(`${match}[^{]*\\{[\\s\\S]*?return apiError[\\s\\S]*?\\}`, "g")
        );
        return funcMatch !== null;
      });

      if (!hasSecurityWrapper && !isAllowlisted && !allMutationsDisabled) {
        const mutations = content.match(/export async function (POST|PUT|DELETE|PATCH)/g) || [];
        violations.push(
          `${routePath} has ${mutations.length} mutation(s) without security wrapper:\n` +
            `  Mutations: ${mutations.join(", ")}\n` +
            `  Fix: Add withUserAndCsrf(), withAdminRoute(), or add to allowlist in test file`
        );
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `\n${violations.length} route(s) violate security requirements:\n\n` +
          violations.join("\n\n")
      );
    }
  });

  it("allowlisted routes have valid justifications", () => {
    // Verify all allowlisted routes actually exist
    for (const [routePath, reason] of Object.entries(ALLOWLISTED_ROUTES)) {
      const fullPath = join(API_DIR, routePath);

      if (!existsSync(fullPath)) {
        throw new Error(
          `Allowlisted route does not exist: ${routePath}\n` +
            `Reason: ${reason}\n` +
            `Remove this entry from ALLOWLISTED_ROUTES`
        );
      }

      // Verify route has at least one mutation
      const content = readFileSync(fullPath, "utf-8");
      const hasMutation = /export async function (POST|PUT|DELETE|PATCH)\s*\(/.test(content);

      if (!hasMutation) {
        throw new Error(
          `Allowlisted route has no mutations: ${routePath}\n` +
            `Reason: ${reason}\n` +
            `Remove this entry from ALLOWLISTED_ROUTES`
        );
      }
    }
  });
});
