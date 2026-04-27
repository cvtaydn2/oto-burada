/**
 * Bug Condition Exploration Test: Duplicate Service Directories
 *
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 *
 * This test encodes the expected behavior after the fix:
 * - Only ONE payment service directory should exist
 * - Only ONE favorites service implementation should exist
 * - No duplicate PaymentService exports should exist
 *
 * When this test PASSES after implementation, it confirms the bug is fixed.
 *
 * Validates Requirements: 2.4, 2.5, 2.6
 */

import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const SERVICES_DIR = path.join(process.cwd(), "src/services");

describe("Bug Condition: Duplicate Service Directories", () => {
  it("should have only ONE payment service directory (not both payment/ and payments/)", () => {
    const paymentDir = path.join(SERVICES_DIR, "payment");
    const paymentsDir = path.join(SERVICES_DIR, "payments");

    const paymentExists = fs.existsSync(paymentDir);
    const paymentsExists = fs.existsSync(paymentsDir);

    // Expected behavior: Only ONE should exist, not both
    const bothExist = paymentExists && paymentsExists;

    expect(bothExist).toBe(false);

    // At least one should exist (we need payment services)
    const atLeastOneExists = paymentExists || paymentsExists;
    expect(atLeastOneExists).toBe(true);
  });

  it("should have only ONE favorites service implementation (not multiple FavoriteService exports)", () => {
    const favoritesDir = path.join(SERVICES_DIR, "favorites");

    if (!fs.existsSync(favoritesDir)) {
      throw new Error("Favorites directory does not exist");
    }

    const files = fs
      .readdirSync(favoritesDir)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

    let favoriteServiceExports = 0;
    const exportingFiles: string[] = [];

    for (const file of files) {
      const filePath = path.join(favoritesDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Check for FavoriteService exports (both class and object patterns)
      if (content.match(/export\s+(class|const)\s+FavoriteService/)) {
        favoriteServiceExports++;
        exportingFiles.push(file);
      }
    }

    // Expected behavior after consolidation: NO FavoriteService exports in services/
    // Favorites functionality is now in server actions (src/app/dashboard/favorites/actions.ts)
    expect(favoriteServiceExports).toBe(0);

    // If this fails, document which files have duplicate exports
    if (favoriteServiceExports > 0) {
      console.error(
        `Found ${favoriteServiceExports} FavoriteService exports in: ${exportingFiles.join(", ")}`
      );
    }
  });

  it("should have no duplicate PaymentService exports", () => {
    const paymentDir = path.join(SERVICES_DIR, "payment");
    const paymentsDir = path.join(SERVICES_DIR, "payments");

    let paymentServiceExports = 0;
    const exportingFiles: string[] = [];

    // Check payment/ directory
    if (fs.existsSync(paymentDir)) {
      const files = fs
        .readdirSync(paymentDir)
        .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

      for (const file of files) {
        const filePath = path.join(paymentDir, file);
        const content = fs.readFileSync(filePath, "utf-8");

        if (content.match(/export\s+(class|const)\s+PaymentService/)) {
          paymentServiceExports++;
          exportingFiles.push(`payment/${file}`);
        }
      }
    }

    // Check payments/ directory
    if (fs.existsSync(paymentsDir)) {
      const files = fs
        .readdirSync(paymentsDir)
        .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

      for (const file of files) {
        const filePath = path.join(paymentsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");

        if (content.match(/export\s+(class|const)\s+PaymentService/)) {
          paymentServiceExports++;
          exportingFiles.push(`payments/${file}`);
        }
      }
    }

    // Expected behavior: Only ONE PaymentService export should exist
    expect(paymentServiceExports).toBe(1);

    // If this fails, document which files have duplicate exports
    if (paymentServiceExports > 1) {
      console.error(
        `Found ${paymentServiceExports} PaymentService exports in: ${exportingFiles.join(", ")}`
      );
    }
  });

  it("should follow naming convention for service files", () => {
    const paymentDir = path.join(SERVICES_DIR, "payment");
    const paymentsDir = path.join(SERVICES_DIR, "payments");

    // After consolidation, we expect files to follow naming conventions:
    // *-actions.ts, *-records.ts, *-logic.ts, *-client.ts
    const deprecatedPatterns = [
      /.*-service\.ts$/, // Legacy class-based services
      /client-service\.ts$/, // Deprecated client service pattern
    ];

    const checkDirectory = (dir: string, dirName: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.startsWith("__"));

      const deprecatedFiles: string[] = [];

      for (const file of files) {
        const hasDeprecatedPattern = deprecatedPatterns.some((pattern) => pattern.test(file));

        if (hasDeprecatedPattern) {
          deprecatedFiles.push(`${dirName}/${file}`);
        }
      }

      // Expected behavior: No deprecated file patterns should exist
      if (deprecatedFiles.length > 0) {
        console.error(`Found deprecated service files: ${deprecatedFiles.join(", ")}`);
      }

      expect(deprecatedFiles.length).toBe(0);
    };

    checkDirectory(paymentDir, "payment");
    checkDirectory(paymentsDir, "payments");
  });
});
