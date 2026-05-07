import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests", "src/**/*.int.test.{ts,tsx}"],
    maxWorkers: process.env.CI ? 3 : 2,
    minWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Target: 90%+ on business-critical paths
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: [
        "src/services/**/*.ts",
        "src/lib/utils/**/*.ts",
        "src/lib/validators/**/*.ts",
        "src/lib/security/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/__tests__/**",
        "src/test/**",
        "src/**/*.d.ts",
        // DB-dependent services — covered by integration tests
        "src/services/*/listing-submissions.ts",
        "src/services/*/marketplace-listings.ts",
      ],
    },
  },
});

