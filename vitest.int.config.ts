import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: "node",
      globals: true,
      include: ["src/**/*.int.test.ts"],
      setupFiles: ["./src/test/setup.int.ts"],
      testTimeout: 30000,
    },
  };
});
