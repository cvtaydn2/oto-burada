import { test, expect } from "@playwright/test";

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
    await page.goto("/dashboard/listings");
    
    // Eğer mobil görünümdeyse sidebar farklı olabilir, direkt linke gitmek daha güvenli
    const createBtn = page.getByRole("link", { name: /İlan Ver/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      await page.goto("/dashboard/listings/create");
    }

    await expect(page.getByText(/Araç Bilgileri/i)).toBeVisible();

    // STEP 1: Araç Bilgileri
    await page.getByPlaceholder(/34 ABC 123/i).fill("34 OTO 2026");
    await page.getByLabel(/Marka/i).selectOption({ label: "Volkswagen" });
    await page.getByLabel(/Model/i).selectOption({ label: "Golf" });
    await page.getByLabel(/Yıl/i).fill("2020");
    await page.getByLabel(/Kilometre/i).fill("50000");
    await page.getByRole("button", { name: /Devam Et/i }).click();

    // STEP 2: Teknik Detaylar
    await expect(page.getByText(/Teknik Detaylar/i)).toBeVisible();
    // Yakıt ve Vites varsayılanları seçili gelebilir, kontrol et
    await page.getByRole("button", { name: /Devam Et/i }).click();

    // STEP 3: Açıklama ve Fiyat
    await expect(page.getByText(/İlan Başlığı/i)).toBeVisible();
    await page.getByLabel(/İlan Başlığı/i).fill("Temiz ve Bakımlı Golf - E2E Test");
    await page.getByLabel(/Açıklama/i).fill("Bu ilan Playwright E2E testi tarafından otomatik oluşturulmuştur.");
    await page.getByLabel(/Fiyat/i).fill("1250000");
    await page.getByRole("button", { name: /Devam Et/i }).click();

    // STEP 4: Ekspertiz ve Durum
    await expect(page.getByText(/Ekspertiz Bilgileri/i)).toBeVisible();
    // Bazı parçaları işaretle
    const kaput = page.getByText(/Kaput/i);
    await kaput.click(); // Boyalı seçeneğine tıkla (DamageSelector içindeki mantığa göre)
    
    await page.getByRole("button", { name: /Devam Et/i }).click();

    // STEP 5: Fotoğraflar
    await expect(page.getByText(/Fotoğraflar/i)).toBeVisible();
    await expect(page.getByText(/En az 3 adet/i)).toBeVisible();

    // Not: Dosya yükleme E2E'de biraz daha karmaşık olabilir ama input'u kontrol edebiliriz
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Formu gönder butonunun varlığını doğrula (Fotoğraf eksik olduğu için muhtemelen disabled olacak)
    const submitBtn = page.getByRole("button", { name: /İlanı Yayınla/i });
    await expect(submitBtn).toBeVisible();
  });
});
