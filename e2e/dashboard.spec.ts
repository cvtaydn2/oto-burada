/**
 * E2E: Dashboard & authenticated flows
 *
 * Bu testler E2E_TEST_EMAIL + E2E_TEST_PASSWORD set edilmişse çalışır.
 * Playwright global setup (auth-setup.ts) session'ı önceden kaydeder.
 */
import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

const AUTH_FILE = path.join(process.cwd(), "playwright", ".auth", "user.json");
const hasAuth = fs.existsSync(AUTH_FILE);

test.describe("Dashboard (Authenticated)", () => {
  test.use({
    storageState: hasAuth ? AUTH_FILE : undefined,
  });

  test.skip(!hasAuth, "Auth state yok — E2E_TEST_EMAIL/PASSWORD set et ve auth-setup çalıştır");

  test("dashboard ana sayfası yükleniyor", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Satıcı Paneli")).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard navigasyon linkleri çalışıyor", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Sidebar nav items
    await expect(page.getByRole("link", { name: /ilanlarım/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /favoriler/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /profil/i })).toBeVisible();
  });

  test("ilanlarım sayfası yükleniyor", async ({ page }) => {
    await page.goto("/dashboard/listings");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("profil sayfası yükleniyor", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(/profil/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("favoriler sayfası yükleniyor", async ({ page }) => {
    await page.goto("/dashboard/favorites");
    await page.waitForLoadState("domcontentloaded");
    // Either favorites list or empty state
    const content = page.locator("h1, h2").first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test("paketler sayfası doping görünürlüğü dili ile yükleniyor", async ({ page }) => {
    await page.goto("/dashboard/pricing");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Doping Paketleri")).toBeVisible({ timeout: 8_000 });

    const visibilityCopy = page.getByText(/satın aldığınız aktif dopingler|yayındaki ilan bulunamadı/i).first();
    await expect(visibilityCopy).toBeVisible({ timeout: 8_000 });
  });

  test("ilan oluşturma sayfası yükleniyor", async ({ page }) => {
    await page.goto("/dashboard/listings/create");
    await page.waitForLoadState("domcontentloaded");
    // Should show the listing wizard, not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 8_000 });
  });

  test("çıkış yapıldıktan sonra dashboard erişilemez", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Find and click logout button
    const logoutBtn = page.getByRole("button", { name: /çıkış/i });
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
    await logoutBtn.click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

test.describe("Admin Panel (Authenticated Admin)", () => {
  test.use({
    storageState: hasAuth ? AUTH_FILE : undefined,
  });

  test.skip(!hasAuth, "Auth state yok");

  test("admin paneli yükleniyor", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    // Admin panel or redirect to login (if not admin)
    const isAdmin = !(await page.url()).includes("/login");
    if (isAdmin) {
      await expect(page.locator("main")).toBeVisible({ timeout: 8_000 });
    }
  });

  test("admin roller sayfası yükleniyor", async ({ page }) => {
    await page.goto("/admin/roles");
    await page.waitForLoadState("domcontentloaded");
    const isAdmin = !(await page.url()).includes("/login");
    if (isAdmin) {
      await expect(page.getByText("Roller ve")).toBeVisible({ timeout: 8_000 });
      // System roles should be visible
      await expect(page.getByText("Süper Admin")).toBeVisible();
    }
  });
});

