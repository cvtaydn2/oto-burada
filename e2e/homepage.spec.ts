import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sayfa başlığı doğru', async ({ page }) => {
    await expect(page).toHaveTitle(/Oto Burada/);
  });

  test('arama kutusu görünür', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Marka"]');
    await expect(searchInput).toBeVisible();
  });

  test('popüler marka butonları görünür', async ({ page }) => {
    await expect(page.getByText('Volkswagen')).toBeVisible();
    await expect(page.getByText('BMW')).toBeVisible();
  });
});

test.describe('İlanlar Sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/listings');
  });

  test('ilanlar listeleniyor', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const listings = page.locator('a[href^="/listing/"]');
    const count = await listings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filtreler çalışıyor', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByText('Filtreler').first().click();
    await expect(page.getByText('Marka')).toBeVisible();
  });
});

test.describe('İlan Detay Sayfası', () => {
  test('ilan detayı yükleniyor', async ({ page }) => {
    await page.goto('/listings');
    await page.waitForLoadState('networkidle');
    
    const firstListing = page.locator('a[href^="/listing/"]').first();
    if (await firstListing.count() > 0) {
      await firstListing.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('Giriş Sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('giriş formu görünür', async ({ page }) => {
    await expect(page.getByPlaceholder('E-posta')).toBeVisible();
    await expect(page.getByPlaceholder('Şifre')).toBeVisible();
  });

  test('kayıt sayfasına yönlendirme', async ({ page }) => {
    await page.getByText('Hesabın yok mu?').click();
    await expect(page).toHaveURL('/register');
  });
});

test.describe('Mobil Uyumluluk', () => {
  test('mobilde düzgün görünüyor', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Marka"]');
    await expect(searchInput).toBeVisible();
  });
});