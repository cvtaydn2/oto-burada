/**
 * Bug Condition Exploration Test: Documentation Clutter
 *
 * Property 1: Bug Condition - Obsolete Documentation Files
 *
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 *
 * GOAL: Surface counterexamples that demonstrate obsolete documentation exists
 *
 * Scoped PBT Approach: Test for existence of phase-specific and duplicate summary files
 *
 * EXPECTED OUTCOME: Test FAILS (this is correct - it proves the bug exists)
 */

import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

describe("Bug Condition: Documentation Clutter", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("should have ≤10 documentation files in repository root", () => {
    const files = fs.readdirSync(rootDir);
    const mdFiles = files.filter((file) => file.endsWith(".md"));

    // Expected: ≤10 files (AGENTS.md, README.md, TASKS.md, PROGRESS.md,
    // DEPLOYMENT_CHECKLIST.md, RUNBOOK.md, and a few others)
    // Current: 52 files (bug exists)
    expect(mdFiles.length).toBeLessThanOrEqual(10);

    if (mdFiles.length > 10) {
      console.log(
        `\n❌ Bug Condition Detected: Found ${mdFiles.length} markdown files in root (expected ≤10)`
      );
      console.log("Obsolete files:", mdFiles.slice(10).join(", "));
    }
  });

  it("should not have phase-specific files in root", () => {
    const files = fs.readdirSync(rootDir);
    const phaseFiles = files.filter(
      (file) => file.startsWith("PHASE_") || file.includes("-PHASE-") || file.startsWith("PHASE-")
    );

    // Expected: 0 phase-specific files
    // Current: Multiple phase files exist (bug exists)
    expect(phaseFiles).toHaveLength(0);

    if (phaseFiles.length > 0) {
      console.log(
        `\n❌ Bug Condition Detected: Found ${phaseFiles.length} phase-specific files in root`
      );
      console.log("Phase files:", phaseFiles.join(", "));
    }
  });

  it("should not have duplicate summary files in root", () => {
    const files = fs.readdirSync(rootDir);
    const summaryFiles = files.filter(
      (file) =>
        file.startsWith("ALL_FIXES_") ||
        file.startsWith("ALL_PHASES_") ||
        file.startsWith("COMPLETE_") ||
        file.startsWith("CRITICAL_FIXES_") ||
        file.includes("SUMMARY") ||
        file.includes("IMPROVEMENTS")
    );

    // Expected: 0 duplicate summary files
    // Current: Multiple summary files exist (bug exists)
    expect(summaryFiles).toHaveLength(0);

    if (summaryFiles.length > 0) {
      console.log(
        `\n❌ Bug Condition Detected: Found ${summaryFiles.length} duplicate summary files in root`
      );
      console.log("Summary files:", summaryFiles.join(", "));
    }
  });

  it("should have only ONE security documentation file", () => {
    const files = fs.readdirSync(rootDir);
    const securityFiles = files.filter((file) => file.includes("SECURITY") && file.endsWith(".md"));

    // Expected: 1 security file (docs/SECURITY.md or SECURITY.md)
    // Current: Multiple security files exist (bug exists)
    expect(securityFiles.length).toBeLessThanOrEqual(1);

    if (securityFiles.length > 1) {
      console.log(
        `\n❌ Bug Condition Detected: Found ${securityFiles.length} security files in root (expected ≤1)`
      );
      console.log("Security files:", securityFiles.join(", "));
    }
  });

  it("should have archived obsolete files", () => {
    const archiveDir = path.join(rootDir, "docs", "archive");
    const archiveExists = fs.existsSync(archiveDir);

    // Expected: Archive directory exists with organized subdirectories
    // Current: No archive directory (bug exists)
    expect(archiveExists).toBe(true);

    if (!archiveExists) {
      console.log("\n❌ Bug Condition Detected: Archive directory does not exist");
      console.log(
        "Expected: docs/archive/ with subdirectories (phases/, summaries/, security/, fixes/)"
      );
    }
  });
});
