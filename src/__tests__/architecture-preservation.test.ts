/**
 * Preservation Property Tests: Application Architecture Unchanged
 *
 * Property 2: Preservation - Application Architecture Unchanged
 *
 * IMPORTANT: Follow observation-first methodology
 *
 * Observe current application behavior before architecture documentation updates
 *
 * EXPECTED OUTCOME: Tests PASS (this confirms baseline behavior to preserve)
 */

import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

describe("Preservation: Application Architecture Unchanged", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("should preserve application build capability", () => {
    // Verify package.json has build script
    const packageJsonPath = path.join(rootDir, "package.json");
    expect(fs.existsSync(packageJsonPath)).toBe(true);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    expect(packageJson.scripts).toHaveProperty("build");
    expect(packageJson.scripts.build).toBeTruthy();
  });

  it("should preserve Next.js configuration", () => {
    // Verify next.config.ts exists
    const nextConfigPath = path.join(rootDir, "next.config.ts");
    expect(fs.existsSync(nextConfigPath)).toBe(true);

    const content = fs.readFileSync(nextConfigPath, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("should preserve TypeScript configuration", () => {
    // Verify tsconfig.json exists
    const tsconfigPath = path.join(rootDir, "tsconfig.json");
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it("should preserve service directory structure", () => {
    const servicesDir = path.join(rootDir, "src", "services");
    expect(fs.existsSync(servicesDir)).toBe(true);

    // Verify key service directories exist
    const keyServices = ["listings", "payments", "favorites", "profile"];

    for (const service of keyServices) {
      const servicePath = path.join(servicesDir, service);
      expect(fs.existsSync(servicePath)).toBe(true);
    }
  });

  it("should preserve domain layer structure", () => {
    const domainDir = path.join(rootDir, "src", "domain");
    expect(fs.existsSync(domainDir)).toBe(true);

    // Verify domain subdirectories
    const logicDir = path.join(domainDir, "logic");
    const usecasesDir = path.join(domainDir, "usecases");

    expect(fs.existsSync(logicDir)).toBe(true);
    expect(fs.existsSync(usecasesDir)).toBe(true);
  });

  it("should preserve app router structure", () => {
    const appDir = path.join(rootDir, "src", "app");
    expect(fs.existsSync(appDir)).toBe(true);

    // Verify key app directories
    const keyDirs = ["dashboard", "admin", "api"];

    for (const dir of keyDirs) {
      const dirPath = path.join(appDir, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    }
  });

  it("should preserve existing server actions", () => {
    // Verify key server action files exist
    const serverActions = [
      "src/app/dashboard/favorites/actions.ts",
      "src/app/api/payments/initialize/route.ts",
      "src/app/api/payments/callback/route.ts",
    ];

    for (const actionPath of serverActions) {
      const actionFullPath = path.join(rootDir, actionPath);
      expect(fs.existsSync(actionFullPath)).toBe(true);
    }
  });

  it("should preserve service record files", () => {
    // Verify key record files exist
    const recordFiles = ["src/services/favorites/favorite-records.ts"];

    for (const recordPath of recordFiles) {
      const fullPath = path.join(rootDir, recordPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it("should preserve business logic files", () => {
    // Verify key logic files exist
    const logicFiles = [
      "src/services/payments/payment-logic.ts",
      "src/services/payments/doping-logic.ts",
    ];

    for (const logicPath of logicFiles) {
      const fullPath = path.join(rootDir, logicPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it("should preserve external API clients", () => {
    // Verify external client files exist
    const clientFiles = ["src/services/payments/iyzico-client.ts"];

    for (const clientPath of clientFiles) {
      const clientFullPath = path.join(rootDir, clientPath);
      expect(fs.existsSync(clientFullPath)).toBe(true);
    }
  });

  it("should preserve AGENTS.md core content", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    const content = fs.readFileSync(agentsPath, "utf-8");

    // Verify core sections are preserved
    expect(content).toContain("## Mission");
    expect(content).toContain("## Architecture Rules");
    expect(content).toContain("## Database Rules");
    expect(content).toContain("## Code Quality Rules");
    expect(content).toContain("## Folder Structure");

    // Verify content is substantial
    expect(content.length).toBeGreaterThan(1000);
  });
});
