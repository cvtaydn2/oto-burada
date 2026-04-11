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
    
    // "Yeni İlan Ver" butonuna tıkla (MyListingsPanel içindeki buton)
    await page.getByRole("button", { name: /Yeni İlan Ver/i }).click();

    await expect(page.getByText(/Araç Bilgileri/i)).toBeVisible();

    // STEP 1: Araç Bilgileri
    await page.getByLabel(/Plaka/i).fill("34 OTO 2026");
    
    // Marka ve Model seçimi (Native select)
    await page.getByLabel(/Marka/i).selectOption("Volkswagen");
    await page.getByLabel(/Model/i).selectOption("Golf");

    await page.getByLabel(/Yıl/i).fill("2020");
    await page.getByLabel(/Kilometre/i).fill("50000");
    await page.getByRole("button", { name: /Sonraki Adım/i }).click();

    // STEP 2: Teknik Detaylar / Konum
    await expect(page.getByText(/Konum ve Teknik Detaylar/i)).toBeVisible();
    
    // Şehir ve İlçe seçimi (Native select)
    await page.getByLabel(/Şehir/i).selectOption("İstanbul");
    await page.getByLabel(/İlçe/i).selectOption("Beşiktaş");

    // Yakıt ve Vites (Native select)
    await page.getByLabel(/Yakıt Tipi/i).selectOption("benzin");
    await page.getByLabel(/Vites Tipi/i).selectOption("otomatik");

    // Başlık, Açıklama ve Fiyat (Native inputs)
    await page.getByLabel(/İlan Başlığı/i).fill("Temiz ve Bakımlı Golf - E2E Test");
    await page.getByLabel(/İçerik \/ Açıklama/i).fill("Bu ilan Playwright E2E testi tarafından otomatik oluşturulmuştur.");
    await page.getByLabel(/Fiyat/i).fill("1250000");

    await page.getByRole("button", { name: /Sonraki Adım/i }).click();

    // STEP 3: Ekspertiz ve Durum
    await expect(page.getByText(/Expertiz Kontrolü/i)).toBeVisible();
    // Parçaları tıklayarak durum değiştirme (DamageSelector)
    // Kaput'a tıklayalım
    await page.getByText(/Kaput/i).click(); 
    
    await page.getByRole("button", { name: /Sonraki Adım/i }).click();

    // STEP 4: Fotoğraflar
    await expect(page.getByText(/Fotoğraflar/i)).toBeVisible();
    
    // Dosya yükleme
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('tests/assets/test-car.jpg');
    
    // Fotoğrafın hazır olduğunu bekle
    await expect(page.getByText(/HAZIR/i).first()).toBeVisible({ timeout: 15000 });

    // Minimum 3 fotoğraf kuralı için diğerlerini de yükle
    const fileInput2 = page.locator('input[type="file"]').nth(1);
    await fileInput2.setInputFiles('tests/assets/test-car.jpg');
    const fileInput3 = page.locator('input[type="file"]').nth(2);
    await fileInput3.setInputFiles('tests/assets/test-car.jpg');

    // Yayınla butonu
    const submitBtn = page.getByRole("button", { name: /İlanı Yayınla/i });
    await expect(submitBtn).toBeEnabled();
    
    await submitBtn.click();

    // Başarı mesajı
    await expect(page.getByText(/İlan başarıyla kaydedildi/i)).toBeVisible({ timeout: 30000 });
  });
});
