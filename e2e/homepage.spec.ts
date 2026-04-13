import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sayfa başlığı doğru', async ({ page }) => {
    await expect(page).toHaveTitle(/Oto Burada/);
  });

  test('arama kutusu görünür', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Örn: BMW 3 Serisi');
    await expect(searchInput).toBeVisible();
  });

  test('popüler kategoriler görünür', async ({ page }) => {
    await expect(page.getByText('Elektrikli')).toBeVisible();
    await expect(page.getByText('SUV')).toBeVisible();
  });
});

test.describe('İlanlar Sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/listings');
  });

  test('ilanlar listeleniyor', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const listings = page.locator('a[href^="/listing/"]').first();
    const emptyState = page.getByText('Sonuç bulunamadı');
    await expect(listings.or(emptyState)).toBeVisible();
  });

  test('filtreler çalışıyor', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const viewportWidth = page.viewportSize()?.width ?? 1280;

    if (viewportWidth < 1024) {
      await page.getByText('Filtreler').first().click();
      await expect(page.getByText('Marka').first()).toBeVisible();
      return;
    }

    await expect(page.getByRole('heading', { name: 'Filtrele' })).toBeVisible();
    await expect(page.getByPlaceholder('Marka ara...')).toBeVisible();
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
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL('/register');
  });
});

test.describe('Dashboard Listing Create Akışı', () => {
  test('yetkisiz kullanıcı create rotasında girişe yönlendirilir', async ({ page }) => {
    await page.goto('/dashboard/listings/create');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByPlaceholder('E-posta')).toBeVisible();
  });
});

test.describe('Mobil Uyumluluk', () => {
  test('mobilde düzgün görünüyor', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByPlaceholder('Örn: BMW 3 Serisi');
    await expect(searchInput).toBeVisible();
  });
});
