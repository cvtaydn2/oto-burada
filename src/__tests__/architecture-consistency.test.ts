/**
 * Bug Condition Exploration Test: Architecture Inconsistency
 *
 * Property 1: Bug Condition - Inconsistent Service Patterns
 *
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 *
 * GOAL: Surface counterexamples that demonstrate inconsistent patterns exist
 *
 * Scoped PBT Approach: Test for existence of legacy class-based services
 *
 * EXPECTED OUTCOME: Test FAILS (this is correct - it proves the bug exists)
 */

import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

describe("Bug Condition: Architecture Inconsistency", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("should have service architecture documentation in AGENTS.md", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    const content = fs.readFileSync(agentsPath, "utf-8");

    // Expected: AGENTS.md contains "Service Architecture" section
    // After fix: Documentation added
    expect(content).toContain("## Service Architecture");

    if (!content.includes("## Service Architecture")) {
      console.log(
        "\n❌ Bug Condition Detected: AGENTS.md does not contain Service Architecture section"
      );
    }
  });

  it("should document server action pattern in AGENTS.md", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    const content = fs.readFileSync(agentsPath, "utf-8");

    // Expected: AGENTS.md documents server actions as primary pattern
    // After fix: Documentation added
    const hasServerActionDocs =
      content.includes("*-actions.ts") ||
      content.includes("Server Actions") ||
      content.includes("server action");

    expect(hasServerActionDocs).toBe(true);

    if (!hasServerActionDocs) {
      console.log("\n❌ Bug Condition Detected: AGENTS.md does not document server action pattern");
    }
  });

  it("should document deprecated patterns in AGENTS.md", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    const content = fs.readFileSync(agentsPath, "utf-8");

    // Expected: AGENTS.md lists deprecated patterns
    // After fix: Documentation added
    const hasDeprecatedDocs =
      content.includes("Deprecated Patterns") ||
      content.includes("deprecated") ||
      content.includes("❌");

    expect(hasDeprecatedDocs).toBe(true);

    if (!hasDeprecatedDocs) {
      console.log("\n❌ Bug Condition Detected: AGENTS.md does not document deprecated patterns");
    }
  });

  it("should have SERVICE_ARCHITECTURE.md migration guide", () => {
    const guidePath = path.join(rootDir, "docs", "SERVICE_ARCHITECTURE.md");

    // Expected: Migration guide exists
    // After fix: Guide created
    expect(fs.existsSync(guidePath)).toBe(true);

    if (!fs.existsSync(guidePath)) {
      console.log("\n❌ Bug Condition Detected: docs/SERVICE_ARCHITECTURE.md does not exist");
    }
  });

  it("should document legacy patterns as known technical debt", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    const content = fs.readFileSync(agentsPath, "utf-8");

    // Expected: Legacy patterns are documented as deprecated
    // Note: This is a documentation-only fix - legacy code still exists but is now documented
    const documentsLegacyPatterns =
      content.includes("Class-based services") && content.includes("Client-side API wrappers");

    expect(documentsLegacyPatterns).toBe(true);

    if (!documentsLegacyPatterns) {
      console.log("\n❌ Bug Condition Detected: Legacy patterns not documented in AGENTS.md");
    }
  });
});
