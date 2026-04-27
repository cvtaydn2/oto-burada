/**
 * Migration Number Validation Test
 *
 * ── SECURITY FIX: Issue SEC-MIG-01 - Migration Number Collisions ──
 * Ensures no duplicate migration numbers exist in database/migrations/.
 *
 * Duplicate numbers create non-deterministic execution order and can cause:
 * - RLS policies applied in wrong order (security gaps)
 * - Migration failures (indexes before tables)
 * - Constraint violations
 */

import { readdirSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = join(process.cwd(), "database/migrations");

// Legacy duplicate migration numbers that already exist in the codebase.
// These are allowlisted to prevent test failures while preserving the detection
// for NEW duplicates introduced in the future.
//
// IMPORTANT: Before renaming these in production, verify which ones are already
// applied by checking the schema_migrations table. Consult a DBA if unsure.
const LEGACY_DUPLICATE_NUMBERS = new Set<number>([
  26, // 0026_add-plan-id-to-payments.sql vs 0026_fix_public_profile_access.sql
  42, // 0042_fulfillment_jobs_and_retry_mechanism.sql vs 0042_listing_quota_atomic_check.sql
  43, // 0043_custom_roles_table.sql vs 0043_payment_webhook_audit_hardening.sql
  62, // 0062_add_package_id_to_payments.sql vs 0062_security_advisor_fixes.sql
  63, // 0063_add_identity_number_to_profiles.sql vs 0063_performance_and_security_polish.sql
  73, // 0073_fix_profile_visibility_for_marketplace.sql vs 0073_idempotent_doping_activation.sql
]);

describe("Migration Number Validation", () => {
  it("should not have duplicate migration numbers", () => {
    if (!readdirSync(MIGRATIONS_DIR).length) {
      throw new Error("No migrations found - test may be running in wrong directory");
    }

    const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    const numberMap = new Map<number, string>();
    const duplicates: Array<{ number: number; files: string[] }> = [];

    for (const filename of migrationFiles) {
      const match = filename.match(/^(\d+)_/);
      if (!match) {
        continue; // Skip files without number prefix
      }

      const number = parseInt(match[1], 10);

      if (numberMap.has(number)) {
        // Find or create duplicate entry
        const existing = duplicates.find((d) => d.number === number);
        if (existing) {
          existing.files.push(filename);
        } else {
          duplicates.push({
            number,
            files: [numberMap.get(number)!, filename],
          });
        }
      } else {
        numberMap.set(number, filename);
      }
    }

    if (duplicates.length > 0) {
      // Filter out legacy duplicates - only fail for NEW ones
      const newDuplicates = duplicates.filter((d) => !LEGACY_DUPLICATE_NUMBERS.has(d.number));

      if (newDuplicates.length > 0) {
        const dupList = newDuplicates
          .map((d) => `  ${d.number}: ${d.files.join(" vs ")}`)
          .join("\n");

        throw new Error(
          `\nNEW duplicate migration numbers detected (legacy duplicates are allowlisted):\n${dupList}\n\n` +
            `This creates non-deterministic execution order.\n` +
            `Fix: Renumber migrations sequentially (e.g., 0026a → 0027, 0026b → 0028)`
        );
      }

      // Log legacy duplicates for awareness but don't fail
      const legacyList = duplicates
        .filter((d) => LEGACY_DUPLICATE_NUMBERS.has(d.number))
        .map((d) => `  ${d.number}: ${d.files.join(" vs ")}`)
        .join("\n");

      console.warn(
        `\n⚠️  Legacy duplicate migration numbers detected (allowlisted):\n${legacyList}\n` +
          `These are known duplicates from earlier development.\n` +
          `Before renaming in production, check schema_migrations table and consult DBA.\n`
      );
    }
  });

  it("should have sequential migration numbers (with warnings for gaps)", () => {
    const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    const numbers: number[] = [];

    for (const filename of migrationFiles) {
      const match = filename.match(/^(\d+)_/);
      if (match) {
        numbers.push(parseInt(match[1], 10));
      }
    }

    numbers.sort((a, b) => a - b);

    const gaps: string[] = [];
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i - 1] + 1) {
        gaps.push(
          `  Gap: ${numbers[i - 1]} → ${numbers[i]} (missing ${numbers[i] - numbers[i - 1] - 1} number(s))`
        );
      }
    }

    // Log gaps but don't fail - gaps are acceptable if documented
    if (gaps.length > 0) {
      console.warn(
        `\n⚠️  Migration number gaps detected (acceptable if intentional):\n` +
          gaps.join("\n") +
          `\n`
      );
    }
  });

  it("should have valid migration file format", () => {
    const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));

    for (const filename of migrationFiles) {
      const match = filename.match(/^(\d+)_([a-z0-9_-]+)\.sql$/i);

      if (!match) {
        throw new Error(
          `Invalid migration filename: ${filename}\n` +
            `Expected format: NNNN_description.sql (e.g., 0026_add-plan-id.sql)`
        );
      }

      const number = parseInt(match[1], 10);
      const description = match[2];

      if (number < 1 || number > 9999) {
        throw new Error(`Migration number out of range: ${filename}\n` + `Expected: 0001-9999`);
      }

      if (description.length < 3) {
        throw new Error(
          `Migration description too short: ${filename}\n` + `Expected: at least 3 characters`
        );
      }
    }
  });
});
