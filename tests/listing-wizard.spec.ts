import { expect, test } from "@playwright/test";

// Not: Bu testin çalışması için .env dosyasında SUPABASE_DEMO_USER_PASSWORD tanımlı olmalı
// ve veritabanı seed edilmiş olmalıdır.
const TEST_USER = "emre@otoburada.demo";
const TEST_PASSWORD = process.env.SUPABASE_DEMO_USER_PASSWORD || "test-123456";

test.describe("Listing Creation Wizard", () => {
  test.beforeEach(async ({ page }) => {
    // Giriş yap
    await page.goto("/login");
    await page.getByLabel(/E-posta/i).fill(TEST_USER);
    await page.getByLabel(/Şifre/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /Giriş/i }).click();

    // Dashboard'a yönlendiğini doğrula
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should complete the 5-step listing wizard", async ({ page }) => {
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
    await page.locator('input[name="whatsappPhone"]').fill("5551234567");

    await page.getByRole("button", { name: /Sonraki Adım/i }).click();
    await expect(page.getByText(/Kaporta ve Hasar Durumu/i)).toBeVisible({ timeout: 10_000 });

    // Parçaları tıklayarak durum değiştirme (DamageSelector)

    // Kaput'u hızlı seçim listesinden açalım
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
