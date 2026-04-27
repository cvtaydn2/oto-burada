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
      const dupList = duplicates.map((d) => `  ${d.number}: ${d.files.join(" vs ")}`).join("\n");

      throw new Error(
        `\nDuplicate migration numbers detected:\n${dupList}\n\n` +
          `This creates non-deterministic execution order.\n` +
          `Fix: Renumber migrations sequentially (e.g., 0026a → 0027, 0026b → 0028)\n` +
          `Note: If duplicates are already applied in production, consult DBA before renaming.`
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
