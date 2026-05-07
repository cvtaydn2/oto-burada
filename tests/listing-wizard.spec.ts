import { expect, test } from "@playwright/test";

// NOTE: This test requires a fully seeded Supabase database with demo user.
// It is marked as skipped in the default run because it depends on:
// - Seeded reference data (cities, districts, brands, models)
// - Seeded demo user (emre@otoburada.demo)
// - Live database with RLS policies
// Run locally with: npx playwright test tests/listing-wizard.spec.ts --project=chromium
test.describe("Listing Creation Wizard", () => {
  test.skip("should complete the 4-step listing wizard", async ({ page }) => {
    const TEST_USER = "emre@otoburada.demo";
    const TEST_PASSWORD = process.env.SUPABASE_DEMO_USER_PASSWORD || "test-123456";

    // Giriş yap
    await page.goto("/login");
    await page.getByLabel(/E-posta/i).fill(TEST_USER);
    await page.getByLabel(/Şifre/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /Giriş/i }).click();

    // Dashboard'a yönlendiğini doğrula
    await expect(page).toHaveURL(/\/dashboard/);

    // 1. İlan formuna git
    await page.goto("/dashboard/listings?create=true");

    await expect(page.getByRole("heading", { name: /İlan Ver|İlanı Güncelle/i }).first()).toBeVisible();
    await expect(page.getByText(/Hızlı Araç Tanımlama/i)).toBeVisible();

    // STEP 1: Araç Bilgileri
    await page.getByPlaceholder(/34 ABC 123/i).fill("34 OTO 2026");
    await page.locator('input[name="vin"]').fill("WVWZZZ1KZ6W000001");

    // Marka ve Model seçimi (Native select)
    await page.locator('select[name="brand"]').selectOption("Volkswagen");
    await page.locator('select[name="model"]').selectOption("Golf");

    await page.locator('input[name="year"]').fill("2020");
    await page.locator('input[name="mileage"]').fill("50000");
    await page.getByRole("button", { name: "Otomobil", exact: true }).click();
    await page.getByRole("button", { name: /Benzin/i }).click();
    await page.getByRole("button", { name: "Otomatik", exact: true }).click();
    await page.getByRole("button", { name: /Sonraki Adım/i }).click();

    // STEP 2: Konum ve Detaylar
    await expect(page.getByText(/Konum Bilgileri/i)).toBeVisible();

    // Şehir ve İlçe seçimi (Native select)
    await page.locator('select[name="city"]').selectOption("İstanbul");
    await page.locator('select[name="district"]').selectOption("Beşiktaş");

    // Başlık, Açıklama ve Fiyat (Native inputs)
    await page.locator('input[name="title"]').fill("Temiz ve Bakımlı Golf - E2E Test");
    await page
      .locator('textarea[name="description"]')
      .fill("Bu ilan Playwright E2E testi tarafından oluşturuldu.");
    await page.locator('input[name="price"]').fill("1250000");
    await page.locator('input[name="whatsappPhone"]').fill("905551234567");

    await page.getByRole("button", { name: /Sonraki Adım/i }).click();
    await expect(page.getByText(/Kaporta ve Hasar Durumu \(İsteğe Bağlı\)/i)).toBeVisible({
      timeout: 10_000,
    });

    // STEP 3: Ekspertiz (İsteğe Bağlı)
    await page.getByTestId("damage-part-kaput").click();
    await page.getByRole("button", { name: /Boyalı|Lokal Boyalı|Değişen|Orijinal/i }).first().click();

    await page.getByRole("button", { name: /Sonraki Adım/i }).click();

    // STEP 4: Fotoğraflar
    await expect(page.getByText(/Medya ve Dosyalar/i)).toBeVisible();

    // Not: Dosya yükleme testi backend'e bağlı olduğundan atlanıyor
    // Gerçek test senaryosunda upload kontrolü eklenebilir

    // Gönder butonunun varlığını kontrol et
    await expect(page.getByRole("button", { name: /Tüm Bilgileri Kaydet/i })).toBeVisible();
  });
});

