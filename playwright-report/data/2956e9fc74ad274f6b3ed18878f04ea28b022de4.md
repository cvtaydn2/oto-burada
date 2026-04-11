# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: listing-wizard.spec.ts >> Listing Creation Wizard >> should complete the 5-step listing wizard
- Location: tests\listing-wizard.spec.ts:20:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Expertiz Kontrolü/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Expertiz Kontrolü/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link "Ana sayfaya dön" [ref=e7] [cursor=pointer]:
            - /url: /
            - img [ref=e8]
          - generic [ref=e10]:
            - paragraph [ref=e11]: Kullanıcı Paneli
            - heading "Hesabını yönet" [level=1] [ref=e12]
            - paragraph [ref=e13]: emre@otoburada.demo
        - button "Çıkış" [ref=e15]
      - navigation "Dashboard menü" [ref=e16]:
        - list [ref=e17]:
          - listitem [ref=e18]:
            - link "Genel Bakış" [ref=e19] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e20]
              - generic [ref=e25]: Genel Bakış
          - listitem [ref=e26]:
            - link "İlanlarım" [ref=e27] [cursor=pointer]:
              - /url: /dashboard/listings
              - img [ref=e28]
              - generic [ref=e31]: İlanlarım
          - listitem [ref=e32]:
            - link "Favoriler" [ref=e33] [cursor=pointer]:
              - /url: /dashboard/favorites
              - img [ref=e34]
              - generic [ref=e36]: Favoriler
          - listitem [ref=e37]:
            - link "Profil" [ref=e38] [cursor=pointer]:
              - /url: /dashboard/profile
              - img [ref=e39]
              - generic [ref=e43]: Profil
          - listitem [ref=e44]:
            - link "Paketler" [ref=e45] [cursor=pointer]:
              - /url: /dashboard/pricing
              - img [ref=e46]
              - generic [ref=e48]: Paketler
      - generic [ref=e50]:
        - generic [ref=e51]:
          - generic [ref=e52]:
            - heading "İlanlarım" [level=2] [ref=e53]
            - paragraph [ref=e54]: 1 ilan • 1 yayında
          - generic [ref=e55]:
            - img [ref=e56]
            - generic [ref=e59]: "Telefon: Kayıtlı"
        - generic [ref=e60]:
          - generic [ref=e61]:
            - generic [ref=e62]:
              - heading "Yeni İlan Ver" [level=3] [ref=e63]
              - button [ref=e64]:
                - img [ref=e65]
            - generic [ref=e69]:
              - generic [ref=e71]:
                - generic [ref=e73]:
                  - img [ref=e75]
                  - generic [ref=e77]: Temel Bilgiler
                - generic [ref=e78]:
                  - img [ref=e80]
                  - generic [ref=e82]: Konum ve Detaylar
                - generic [ref=e83]:
                  - generic [ref=e84]: "3"
                  - generic [ref=e85]: Ekspertiz ve Kondisyon
                - generic [ref=e86]:
                  - generic [ref=e87]: "4"
                  - generic [ref=e88]: Fotoğraflar ve Gönderim
              - generic [ref=e89]:
                - generic [ref=e92]:
                  - generic [ref=e93]:
                    - img [ref=e95]
                    - generic [ref=e98]:
                      - heading "Ekspertiz Bilgileri" [level=3] [ref=e99]
                      - paragraph [ref=e100]: Aracın kaporta ve mekanik durumunu belirtin.
                  - generic [ref=e101]:
                    - generic [ref=e102]:
                      - heading "Kaporta Durumu (Boya / Değişen)" [level=4] [ref=e103]
                      - generic [ref=e104]:
                        - generic [ref=e106]:
                          - img [ref=e108]
                          - paragraph [ref=e110]: Aracın üzerindeki parçalara tıklayarak durumunu seçebilirsin.
                        - generic [ref=e111]:
                          - img [ref=e113]
                          - generic [ref=e130]:
                            - generic [ref=e131]:
                              - heading "EKSPERTİZ ÖZETİ (0 Parça)" [level=4] [ref=e132]
                              - generic [ref=e133]:
                                - img [ref=e134]
                                - paragraph [ref=e137]: Tüm parçalar orijinal
                                - paragraph [ref=e138]: Değişen veya boyalı parça varsa listeden veya görselden seçebilirsin.
                            - generic [ref=e139]:
                              - generic [ref=e140]:
                                - button "Kaput" [ref=e141]:
                                  - generic [ref=e142]: Kaput
                                  - img [ref=e143]
                                - button "Tavan" [ref=e145]:
                                  - generic [ref=e146]: Tavan
                                  - img [ref=e147]
                                - button "Bagaj" [ref=e149]:
                                  - generic [ref=e150]: Bagaj
                                  - img [ref=e151]
                                - button "Sol Ön Çamurluk" [ref=e153]:
                                  - generic [ref=e154]: Sol Ön Çamurluk
                                  - img [ref=e155]
                              - generic [ref=e157]:
                                - paragraph [ref=e158]: Hızlı İpucu
                                - paragraph [ref=e159]: Görsel üzerinde her parçayı kolayca işaretleyebilirsin. Şeffaf ekspertiz bilgisi alıcıların %40 daha hızlı karar vermesini sağlar.
                        - generic [ref=e160]:
                          - generic [ref=e161]: "Lejand:"
                          - generic [ref=e162]: Boyalı
                          - generic [ref=e164]: Lokal Boyalı
                          - generic [ref=e166]: Değişen
                    - generic [ref=e169]:
                      - text: Tramer Kaydı (TL)
                      - spinbutton [ref=e170]: "0"
                      - paragraph [ref=e171]: Hasar kaydı yoksa 0 giriniz.
                    - generic [ref=e172]:
                      - heading "Detaylı Ekspertiz Raporu (Opsiyonel)" [level=4] [ref=e173]
                      - generic [ref=e174]:
                        - generic [ref=e175]:
                          - generic [ref=e176]:
                            - img [ref=e178]
                            - generic [ref=e181]:
                              - heading "Profesyonel Ekspertiz Raporu" [level=4] [ref=e182]
                              - paragraph [ref=e183]: İlanınıza güven katar, 5 kat daha hızlı satış sağlar.
                          - generic [ref=e184]:
                            - button "YOK" [ref=e185]
                            - button "VAR" [ref=e186]
                        - generic [ref=e187]:
                          - img [ref=e188]
                          - heading "Raporun Yok mu?" [level=5] [ref=e191]
                          - paragraph [ref=e192]: Ekspertiz raporun yoksa bu aşamayı boş bırakabilirsin. Ancak raporlu ilanlar alıcıların daha çok ilgisini çeker.
                - generic [ref=e193]:
                  - button "Geri" [ref=e194]:
                    - img [ref=e195]
                    - text: Geri
                  - button "Sonraki Adım" [active] [ref=e197]:
                    - text: Sonraki Adım
                    - img [ref=e198]
          - generic [ref=e200]:
            - heading "1 ilan" [level=3] [ref=e201]
            - generic [ref=e203]:
              - generic [ref=e205]:
                - generic [ref=e207]: Yayında
                - paragraph [ref=e208]: 2018 Volkswagen Golf 1.6 TDI Comfortline
                - paragraph [ref=e209]: ₺875.000
                - generic [ref=e210]:
                  - generic [ref=e211]: "2018"
                  - generic [ref=e212]: •
                  - generic [ref=e213]: 118.000 km
              - generic [ref=e214]:
                - link "Düzenle" [ref=e215] [cursor=pointer]:
                  - /url: /dashboard/listings?edit=2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1
                  - img [ref=e216]
                  - text: Düzenle
                - button "EİDS ile Doğrula" [ref=e219]:
                  - img [ref=e220]
                  - text: EİDS ile Doğrula
                - button "Hızlandır" [ref=e223]:
                  - img [ref=e224]
                  - text: Hızlandır
                - button "Yenile" [ref=e229]:
                  - img [ref=e230]
                  - text: Yenile
                - button "Arşivle" [ref=e233]:
                  - img [ref=e234]
                  - text: Arşivle
  - alert [ref=e237]
  - generic [ref=e239]:
    - button [ref=e240]:
      - img [ref=e241]
    - generic [ref=e244]:
      - img [ref=e246]
      - generic [ref=e249]:
        - heading "OtoBurada'yı Uygulama Olarak Ekle" [level=3] [ref=e250]
        - paragraph [ref=e251]: İlanlara daha hızlı ulaşmak için ana ekranına ekle.
    - button "Uygulamayı Kur" [ref=e253]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | // Not: Bu testin çalışması için .env dosyasında SUPABASE_DEMO_USER_PASSWORD tanımlı olmalı 
  4  | // ve veritabanı seed edilmiş olmalıdır.
  5  | const TEST_USER = "emre@otoburada.demo";
  6  | const TEST_PASSWORD = process.env.SUPABASE_DEMO_USER_PASSWORD || "test-123456";
  7  | 
  8  | test.describe("Listing Creation Wizard", () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // Giriş yap
  11 |     await page.goto("/login");
  12 |     await page.getByLabel(/E-posta/i).fill(TEST_USER);
  13 |     await page.getByLabel(/Şifre/i).fill(TEST_PASSWORD);
  14 |     await page.getByRole("button", { name: /Giriş/i }).click();
  15 | 
  16 |     // Dashboard'a yönlendiğini doğrula
  17 |     await expect(page).toHaveURL(/\/dashboard/);
  18 |   });
  19 | 
  20 |   test("should complete the 5-step listing wizard", async ({ page }) => {
  21 |     // 1. İlan formuna git
  22 |     await page.goto("/dashboard/listings");
  23 |     
  24 |     // "Yeni İlan Ver" butonuna tıkla (MyListingsPanel içindeki buton)
  25 |     await page.getByRole("button", { name: /Yeni İlan Ver/i }).click();
  26 | 
  27 |     await expect(page.getByText(/Araç Bilgileri/i)).toBeVisible();
  28 | 
  29 |     // STEP 1: Araç Bilgileri
  30 |     await page.getByLabel(/Plaka/i).fill("34 OTO 2026");
  31 |     
  32 |     // Marka ve Model seçimi (Native select)
  33 |     await page.getByLabel(/Marka/i).selectOption("Volkswagen");
  34 |     await page.getByLabel(/Model/i).selectOption("Golf");
  35 | 
  36 |     await page.getByLabel(/Yıl/i).fill("2020");
  37 |     await page.getByLabel(/Kilometre/i).fill("50000");
  38 |     await page.getByRole("button", { name: /Sonraki Adım/i }).click();
  39 | 
  40 |     // STEP 2: Teknik Detaylar / Konum
  41 |     await expect(page.getByText(/Konum ve Teknik Detaylar/i)).toBeVisible();
  42 |     
  43 |     // Şehir ve İlçe seçimi (Native select)
  44 |     await page.getByLabel(/Şehir/i).selectOption("İstanbul");
  45 |     await page.getByLabel(/İlçe/i).selectOption("Beşiktaş");
  46 | 
  47 |     // Yakıt ve Vites (Native select)
  48 |     await page.getByLabel(/Yakıt Tipi/i).selectOption("benzin");
  49 |     await page.getByLabel(/Vites Tipi/i).selectOption("otomatik");
  50 | 
  51 |     // Başlık, Açıklama ve Fiyat (Native inputs)
  52 |     await page.getByLabel(/İlan Başlığı/i).fill("Temiz ve Bakımlı Golf - E2E Test");
  53 |     await page.getByLabel(/İçerik \/ Açıklama/i).fill("Bu ilan Playwright E2E testi tarafından otomatik oluşturulmuştur.");
  54 |     await page.getByLabel(/Fiyat/i).fill("1250000");
  55 | 
  56 |     await page.getByRole("button", { name: /Sonraki Adım/i }).click();
  57 | 
  58 |     // STEP 3: Ekspertiz ve Durum
> 59 |     await expect(page.getByText(/Expertiz Kontrolü/i)).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  60 |     // Parçaları tıklayarak durum değiştirme (DamageSelector)
  61 |     // Kaput'a tıklayalım
  62 |     await page.getByText(/Kaput/i).click(); 
  63 |     
  64 |     await page.getByRole("button", { name: /Sonraki Adım/i }).click();
  65 | 
  66 |     // STEP 4: Fotoğraflar
  67 |     await expect(page.getByText(/Fotoğraflar/i)).toBeVisible();
  68 |     
  69 |     // Dosya yükleme
  70 |     const fileInput = page.locator('input[type="file"]').first();
  71 |     await fileInput.setInputFiles('tests/assets/test-car.jpg');
  72 |     
  73 |     // Fotoğrafın hazır olduğunu bekle
  74 |     await expect(page.getByText(/HAZIR/i).first()).toBeVisible({ timeout: 15000 });
  75 | 
  76 |     // Minimum 3 fotoğraf kuralı için diğerlerini de yükle
  77 |     const fileInput2 = page.locator('input[type="file"]').nth(1);
  78 |     await fileInput2.setInputFiles('tests/assets/test-car.jpg');
  79 |     const fileInput3 = page.locator('input[type="file"]').nth(2);
  80 |     await fileInput3.setInputFiles('tests/assets/test-car.jpg');
  81 | 
  82 |     // Yayınla butonu
  83 |     const submitBtn = page.getByRole("button", { name: /İlanı Yayınla/i });
  84 |     await expect(submitBtn).toBeEnabled();
  85 |     
  86 |     await submitBtn.click();
  87 | 
  88 |     // Başarı mesajı
  89 |     await expect(page.getByText(/İlan başarıyla kaydedildi/i)).toBeVisible({ timeout: 30000 });
  90 |   });
  91 | });
  92 | 
```