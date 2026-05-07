/**
 * auth-setup.ts — Playwright global setup
 *
 * E2E_TEST_EMAIL ve E2E_TEST_PASSWORD set edilmişse bir kez login olur,
 * session'ı playwright/.auth/user.json'a kaydeder.
 * Authenticated testler bu storage state'i kullanır — her test tekrar login yapmaz.
 *
 * Kullanım:
 *   E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... npx playwright test
 */

import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const AUTH_FILE = path.join(process.cwd(), "playwright", ".auth", "user.json");

export default async function globalSetup(): Promise<void> {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    console.log("⏭  E2E_TEST_EMAIL/PASSWORD not set — skipping auth setup");
    return;
  }

  // Ensure directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

  await page.goto(`${baseURL}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /giriş yap/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

  // Save storage state (cookies + localStorage)
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✅ Auth state saved to ${AUTH_FILE}`);

  await browser.close();
}

