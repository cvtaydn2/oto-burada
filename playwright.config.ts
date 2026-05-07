import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const webServerCommand = process.env.CI
  ? "npm run build && npm run start"
  : "npm run dev";
const webServerReuseExisting = process.env.CI ? false : true;
const maintenanceBypass =
  process.env.PLAYWRIGHT_ENABLE_MAINTENANCE === "true"
    ? process.env.MAINTENANCE_MODE_BYPASS
    : process.env.MAINTENANCE_MODE_BYPASS || "true";
const webServerEnv = {
  ...process.env,
  ...(maintenanceBypass !== undefined ? { MAINTENANCE_MODE_BYPASS: maintenanceBypass } : {}),
};

export default defineConfig({
  testDir: ".",
  testMatch: [
    "e2e/**/*.spec.ts",
    "tests/**/*.spec.ts",
    "tests/api/**/*.spec.ts"
  ],
  fullyParallel: process.env.CI ? true : false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : process.env.CI ? 2 : 2,
  globalSetup: process.env.E2E_TEST_EMAIL ? "./e2e/auth-setup.ts" : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: webServerCommand,
    cwd: ".",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: webServerReuseExisting,
    env: webServerEnv,
  },
});


