/**
 * E2E: Authentication flows
 * - Login with valid credentials
 * - Login with invalid credentials shows error
 * - Unauthenticated redirect to /login
 * - Logout clears session
 */
import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'test@otoburada.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'testpassword123';

test.describe('Kimlik Doğrulama', () => {
  test('geçersiz şifre ile giriş hata gösterir', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-posta').fill('wrong@example.com');
    await page.getByLabel('Şifre').fill('wrongpassword');
    await page.getByRole('button', { name: /giriş yap/i }).click();

    // Error message should appear (role=alert from our AuthForm fix)
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 8_000 });
  });

  test('korumalı rotaya erişim girişe yönlendirir', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin rotasına erişim girişe yönlendirir', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('giriş sayfasında kayıt sekmesi çalışır', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /kayıt ol/i }).first().click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByLabel('E-posta')).toBeVisible();
    await expect(page.getByLabel('Şifre')).toBeVisible();
  });

  test('şifremi unuttum linki görünür', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /şifremi unuttum/i })).toBeVisible();
  });

  // Authenticated flow — only runs when test credentials are provided
  test.describe('Oturum Açık Akışlar', () => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'E2E_TEST_EMAIL not set — skipping authenticated tests');

    test('geçerli kimlik bilgileriyle giriş yapılır ve dashboard görünür', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('E-posta').fill(TEST_EMAIL);
      await page.getByLabel('Şifre').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /giriş yap/i }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
      await expect(page.getByText('Satıcı Paneli')).toBeVisible();
    });

    test('çıkış yapıldıktan sonra dashboard erişilemez', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByLabel('E-posta').fill(TEST_EMAIL);
      await page.getByLabel('Şifre').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /giriş yap/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Logout
      await page.getByRole('button', { name: /çıkış/i }).click();

      // Should redirect to login
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
