/**
 * E2E: Authentication flows
 * - Login with valid credentials
 * - Login with invalid credentials shows error
 * - Unauthenticated redirect to /login
 * - Logout clears session
 */
import { expect, test } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

test.describe("Kimlik Doğrulama", () => {
  test("geçersiz şifre ile giriş hata gösterir", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: /giriş yap/i }).click();

    // role=alert ile hata mesajı
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
  });

  test("korumalı rotaya erişim girişe yönlendirir", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin rotasına erişim girişe yönlendirir", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("giriş sayfasında kayıt linki çalışır", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("link", { name: /kayıt ol/i })
      .first()
      .click();
    await expect(page).toHaveURL("/register");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("şifremi unuttum linki görünür ve çalışır", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const forgotLink = page.getByRole("link", { name: /unuttum/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test("kayıt sayfasında giriş yap linki çalışır", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("link", { name: /giriş yap/i })
      .first()
      .click();
    await expect(page).toHaveURL("/login");
  });

  test("auth sayfalarında header/nav yok (minimal layout)", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    // Auth layout'ta public site header (sticky top nav) olmamalı
    // Yeni (auth) layout'ta header[role="banner"] render edilmiyor
    // Ama public shell'in header'ı hâlâ DOM'da olabilir — sadece gizli
    // Gerçek kontrol: "İlan Ver" CTA butonu auth sayfasında görünmemeli
    const postListingCta = page.getByRole("link", { name: /ilan ver/i });
    await expect(postListingCta).not.toBeVisible();
  });

  // Authenticated flow — only runs when test credentials are provided
  test.describe("Oturum Açık Akışlar", () => {
    test.skip(!TEST_EMAIL, "E2E_TEST_EMAIL set edilmemiş — authenticated testler atlanıyor");

    test("geçerli kimlik bilgileriyle giriş yapılır", async ({ page }) => {
      await page.goto("/login");
      await page.locator("#email").fill(TEST_EMAIL);
      await page.locator("#password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /giriş yap/i }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 12_000 });
      await expect(page.getByText("Satıcı Paneli")).toBeVisible();
    });

    test("çıkış yapıldıktan sonra dashboard erişilemez", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.locator("#email").fill(TEST_EMAIL);
      await page.locator("#password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /giriş yap/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 12_000 });

      // Logout
      await page.getByRole("button", { name: /çıkış/i }).click();

      // Dashboard erişilemez
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
