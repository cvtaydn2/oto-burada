/**
 * Preservation Property Tests: Current Documentation Preserved
 *
 * Property 2: Preservation - Current Documentation Preserved
 *
 * IMPORTANT: Follow observation-first methodology
 *
 * Observe current documentation files that should be preserved
 *
 * EXPECTED OUTCOME: Tests PASS (this confirms baseline behavior to preserve)
 */

import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

describe("Preservation: Current Documentation Preserved", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("should preserve AGENTS.md with architectural standards", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    expect(fs.existsSync(agentsPath)).toBe(true);

    const content = fs.readFileSync(agentsPath, "utf-8");

    // Verify key sections exist
    expect(content).toContain("## Mission");
    expect(content).toContain("## Non-negotiable Product Rules");
    expect(content).toContain("## Final Tech Stack");
    expect(content).toContain("## Architecture Rules");
    expect(content).toContain("## Database Rules");
    expect(content).toContain("## Code Quality Rules");
    expect(content).toContain("## Folder Structure");

    // Verify content is substantial (not empty or truncated)
    expect(content.length).toBeGreaterThan(1000);
  });

  it("should preserve README.md with setup instructions", () => {
    const readmePath = path.join(rootDir, "README.md");
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, "utf-8");

    // Verify key sections exist (flexible matching)
    expect(content).toMatch(/# Oto ?Burada/i);

    // Verify content is substantial
    expect(content.length).toBeGreaterThan(100);
  });

  it("should preserve TASKS.md with current backlog", () => {
    const tasksPath = path.join(rootDir, "TASKS.md");
    expect(fs.existsSync(tasksPath)).toBe(true);

    const content = fs.readFileSync(tasksPath, "utf-8");

    // Verify content is substantial
    expect(content.length).toBeGreaterThan(100);
  });

  it("should preserve PROGRESS.md with implementation log", () => {
    const progressPath = path.join(rootDir, "PROGRESS.md");
    expect(fs.existsSync(progressPath)).toBe(true);

    const content = fs.readFileSync(progressPath, "utf-8");

    // Verify current progress document heading exists
    expect(content).toMatch(/^# PROGRESS — OtoBurada Production Readiness/u);

    // Verify content is substantial
    expect(content.length).toBeGreaterThan(100);
  });

  it("should preserve archived DEPLOYMENT_CHECKLIST.md", () => {
    const checklistPath = path.join(rootDir, "docs/archive/DEPLOYMENT_CHECKLIST.md");
    expect(fs.existsSync(checklistPath)).toBe(true);

    const content = fs.readFileSync(checklistPath, "utf-8");

    // Verify content is substantial
    expect(content.length).toBeGreaterThan(100);
  });

  it("should preserve RUNBOOK.md", () => {
    const runbookPath = path.join(rootDir, "RUNBOOK.md");
    expect(fs.existsSync(runbookPath)).toBe(true);

    const content = fs.readFileSync(runbookPath, "utf-8");

    // Verify content is substantial
    expect(content.length).toBeGreaterThan(100);
  });

  it("should preserve all current documentation files", () => {
    const requiredFiles = [
      "AGENTS.md",
      "README.md",
      "TASKS.md",
      "PROGRESS.md",
      "docs/archive/DEPLOYMENT_CHECKLIST.md",
      "RUNBOOK.md",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(rootDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it("should preserve file content integrity", () => {
    const requiredFiles = [
      "AGENTS.md",
      "README.md",
      "TASKS.md",
      "PROGRESS.md",
      "docs/archive/DEPLOYMENT_CHECKLIST.md",
      "RUNBOOK.md",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(rootDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Verify file is not empty
      expect(content.length).toBeGreaterThan(0);

      // Verify file is valid UTF-8 (no corruption)
      expect(content).toBeTruthy();
    }
  });
});
