# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Homepage >> should show listing cards
- Location: tests\e2e.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('article').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('article').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "OtoBurada - Ana Sayfa" [ref=e7] [cursor=pointer]:
          - /url: /
          - img [ref=e9]
          - text: OtoBurada
        - generic [ref=e14]:
          - img [ref=e15]
          - combobox "Ara" [ref=e18]
          - text: ⌘K
        - navigation "Ana navigasyon" [ref=e19]:
          - link "Favoriler" [ref=e20] [cursor=pointer]:
            - /url: /favorites
            - img [ref=e21]
          - link "Giriş" [ref=e23] [cursor=pointer]:
            - /url: /login
            - img [ref=e24]
            - text: Giriş
          - link "İlan Ver" [ref=e27] [cursor=pointer]:
            - /url: /login
            - img [ref=e28]
            - text: İlan Ver
        - button "Menüyü aç" [ref=e31]:
          - img [ref=e32]
    - generic [ref=e33]:
      - main [ref=e34]:
        - main [ref=e35]:
          - generic [ref=e36]:
            - generic [ref=e38]:
              - heading "Hayalindeki Arabayı Bul" [level=1] [ref=e39]
              - paragraph [ref=e40]: Turkiye nin en guvenilir 2. el ve sifir otomobil pazarı. Binlerce ara tek tik uzakta.
              - generic [ref=e41]:
                - link "Volkswagen" [ref=e42] [cursor=pointer]:
                  - /url: /listings?brand=Volkswagen
                - link "Renault" [ref=e43] [cursor=pointer]:
                  - /url: /listings?brand=Renault
                - link "Fiat" [ref=e44] [cursor=pointer]:
                  - /url: /listings?brand=Fiat
                - link "Toyota" [ref=e45] [cursor=pointer]:
                  - /url: /listings?brand=Toyota
                - link "Ford" [ref=e46] [cursor=pointer]:
                  - /url: /listings?brand=Ford
            - generic [ref=e47]:
              - generic [ref=e48]:
                - paragraph [ref=e49]: 0+
                - paragraph [ref=e50]: İlan
              - generic [ref=e51]:
                - paragraph [ref=e52]: "41"
                - paragraph [ref=e53]: Marka
              - generic [ref=e54]:
                - paragraph [ref=e55]: "74"
                - paragraph [ref=e56]: Şehir
              - generic [ref=e57]:
                - paragraph [ref=e58]: "%100"
                - paragraph [ref=e59]: Ücretsiz
          - generic [ref=e60]:
            - complementary [ref=e61]:
              - generic [ref=e63]:
                - generic [ref=e65]:
                  - img [ref=e67]
                  - generic [ref=e68]:
                    - heading "Filtrele" [level=2] [ref=e69]
                    - paragraph [ref=e70]: Aradığın aracı bul
                - generic [ref=e71]:
                  - heading "Hızlı Seçimler" [level=3] [ref=e72]
                  - generic [ref=e73]:
                    - button "Dusuk KM" [ref=e74]
                    - button "Otomatik" [ref=e75]
                    - button "Butce Dostu" [ref=e76]
                    - button "Yeni Model" [ref=e77]
                - generic [ref=e78]:
                  - generic [ref=e79]:
                    - button "Arama" [ref=e80]:
                      - text: Arama
                      - img [ref=e81]
                    - generic [ref=e84]:
                      - img [ref=e85]
                      - textbox "Marka, model veya şehir" [ref=e88]
                  - generic [ref=e89]:
                    - button "Sıralama" [ref=e90]:
                      - text: Sıralama
                      - img [ref=e91]
                    - combobox [ref=e94]:
                      - option "En yeni" [selected]
                      - option "Fiyat artan"
                      - option "Fiyat azalan"
                      - option "KM düşük"
                      - option "Model yılı yeni"
                  - generic [ref=e95]:
                    - button "Marka & Model" [ref=e96]:
                      - text: Marka & Model
                      - img [ref=e97]
                    - combobox [ref=e101]:
                      - option "Tüm Markalar" [selected]
                      - option "Volkswagen"
                      - option "Renault"
                      - option "Fiat"
                      - option "Toyota"
                      - option "Ford"
                      - option "BMW"
                      - option "Mercedes-Benz"
                      - option "Hyundai"
                      - option "Honda"
                      - option "Peugeot"
                      - option "Audi"
                      - option "Opel"
                      - option "Citroën"
                      - option "Skoda"
                      - option "Seat"
                      - option "Dacia"
                      - option "Kia"
                      - option "Nissan"
                      - option "Mitsubishi"
                      - option "Suzuki"
                      - option "SsangYong"
                      - option "Subaru"
                      - option "Volvo"
                      - option "Jaguar"
                      - option "Land Rover"
                      - option "Porsche"
                      - option "MINI"
                      - option "Togg"
                      - option "Tesla"
                      - option "Alfa Romeo"
                      - option "Mazda"
                      - option "Lexus"
                      - option "Infiniti"
                      - option "Chevrolet"
                      - option "Dodge"
                      - option "Jeep"
                      - option "Isuzu"
                      - option "Haval"
                      - option "Changan"
                      - option "MG"
                      - option "Cupra"
                  - generic [ref=e102]:
                    - button "Konum" [ref=e103]:
                      - text: Konum
                      - img [ref=e104]
                    - combobox [ref=e108]:
                      - option "Tüm Şehirler" [selected]
                      - option "İstanbul"
                      - option "Ankara"
                      - option "İzmir"
                      - option "Adana"
                      - option "Adıyaman"
                      - option "Afyonkarahisar"
                      - option "Ağrı"
                      - option "Aksaray"
                      - option "Amasya"
                      - option "Antalya"
                      - option "Ardahan"
                      - option "Artvin"
                      - option "Aydın"
                      - option "Balıkesir"
                      - option "Bartın"
                      - option "Batman"
                      - option "Bayburt"
                      - option "Bilecik"
                      - option "Bingöl"
                      - option "Bitlis"
                      - option "Bolu"
                      - option "Burdur"
                      - option "Bursa"
                      - option "Çanakkale"
                      - option "Çankırı"
                      - option "Çorum"
                      - option "Denizli"
                      - option "Diyarbakır"
                      - option "Düzce"
                      - option "Edirne"
                      - option "Elazığ"
                      - option "Erzincan"
                      - option "Erzurum"
                      - option "Eskişehir"
                      - option "Gaziantep"
                      - option "Giresun"
                      - option "Gümüşhane"
                      - option "Hakkari"
                      - option "Hatay"
                      - option "Isparta"
                      - option "Mersin"
                      - option "Kars"
                      - option "Kastamonu"
                      - option "Kayseri"
                      - option "Kırklareli"
                      - option "Kırşehir"
                      - option "Kilis"
                      - option "Kütahya"
                      - option "Malatya"
                      - option "Manisa"
                      - option "Kahramanmaraş"
                      - option "Mardin"
                      - option "Muğla"
                      - option "Muş"
                      - option "Nevşehir"
                      - option "Niğde"
                      - option "Ordu"
                      - option "Osmaniye"
                      - option "Rize"
                      - option "Samsun"
                      - option "Şanlıurfa"
                      - option "Şırnak"
                      - option "Tekirdağ"
                      - option "Tokat"
                      - option "Trabzon"
                      - option "Tunceli"
                      - option "Uşak"
                      - option "Van"
                      - option "Yalova"
                      - option "Zonguldak"
                      - option "Karaman"
                      - option "Kırıkkale"
                      - option "Iğdır"
                      - option "Karabük"
                  - generic [ref=e109]:
                    - button "Özellikler" [ref=e110]:
                      - text: Özellikler
                      - img [ref=e111]
                    - generic [ref=e114]:
                      - combobox [ref=e115]:
                        - option "Yakıt Türü" [selected]
                        - option "benzin"
                        - option "dizel"
                        - option "lpg"
                        - option "hibrit"
                        - option "elektrik"
                      - combobox [ref=e116]:
                        - option "Vites" [selected]
                        - option "manuel"
                        - option "otomatik"
                        - option "yari_otomatik"
                  - generic [ref=e117]:
                    - button "Fiyat" [ref=e118]:
                      - text: Fiyat
                      - img [ref=e119]
                    - generic [ref=e122]:
                      - generic [ref=e123]:
                        - spinbutton [ref=e124]
                        - text: TL
                      - generic [ref=e125]:
                        - spinbutton [ref=e126]
                        - text: TL
                  - generic [ref=e127]:
                    - button "Yıl & KM" [ref=e128]:
                      - text: Yıl & KM
                      - img [ref=e129]
                    - generic [ref=e132]:
                      - generic [ref=e133]:
                        - spinbutton [ref=e134]
                        - spinbutton [ref=e135]
                      - generic [ref=e136]:
                        - spinbutton [ref=e137]
                        - text: km
            - generic [ref=e138]:
              - generic [ref=e140]:
                - generic [ref=e141]:
                  - heading "Tüm İlanlar" [level=1] [ref=e142]
                  - paragraph [ref=e143]: 0 araç bulundu
                - generic [ref=e144]:
                  - link "Giris yap ve aramayi kaydet" [ref=e145] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e146]
                    - text: Giris yap ve aramayi kaydet
                  - paragraph [ref=e149]: Kayitli aramalar yeni sonuclari dashboard'dan takip etmeni saglar.
                - generic [ref=e150]:
                  - generic [ref=e151]:
                    - button "Liste görünümü" [ref=e152]:
                      - img [ref=e153]
                    - button "Izgara görünümü" [ref=e154]:
                      - img [ref=e155]
                  - combobox [ref=e160]:
                    - option "12" [selected]
                    - option "24"
                    - option "48"
                    - option "96"
                  - button "Filtrele" [ref=e161]:
                    - img [ref=e162]
                    - text: Filtrele
              - generic [ref=e164]:
                - img [ref=e166]
                - heading "İlan bulunamadı" [level=2] [ref=e169]
                - paragraph [ref=e170]: Aradığın kriterlere uygun araç bulunamadı. Filtreleri temizleyip yeniden dene.
                - button "Filtreleri Temizle" [ref=e171]
      - contentinfo [ref=e172]:
        - generic [ref=e173]:
          - generic [ref=e174]:
            - generic [ref=e175]:
              - link "OtoBurada" [ref=e176] [cursor=pointer]:
                - /url: /
                - img [ref=e178]
                - text: OtoBurada
              - paragraph [ref=e181]: Turkiye nin en guvenilir 2. el ve sifir otomobil pazarı. Arabanı sat, hayalindeki arabayı bul.
              - generic [ref=e182]:
                - generic [ref=e183]: 41+ Marka
                - generic [ref=e184]: 74 Şehir
                - text: Ücretsiz İlan
            - generic [ref=e185]:
              - heading "Hızlı Erişim" [level=3] [ref=e186]
              - list [ref=e187]:
                - listitem [ref=e188]:
                  - link "Ana Sayfa" [ref=e189] [cursor=pointer]:
                    - /url: /
                - listitem [ref=e190]:
                  - link "Tüm İlanlar" [ref=e191] [cursor=pointer]:
                    - /url: /listings
                - listitem [ref=e192]:
                  - link "İlan Ver" [ref=e193] [cursor=pointer]:
                    - /url: /dashboard/listings
                - listitem [ref=e194]:
                  - link "Giriş Yap" [ref=e195] [cursor=pointer]:
                    - /url: /login
            - generic [ref=e196]:
              - heading "Popüler Markalar" [level=3] [ref=e197]
              - list [ref=e198]:
                - listitem [ref=e199]:
                  - link "Volkswagen" [ref=e200] [cursor=pointer]:
                    - /url: /listings?brand=Volkswagen
                - listitem [ref=e201]:
                  - link "Renault" [ref=e202] [cursor=pointer]:
                    - /url: /listings?brand=Renault
                - listitem [ref=e203]:
                  - link "Fiat" [ref=e204] [cursor=pointer]:
                    - /url: /listings?brand=Fiat
                - listitem [ref=e205]:
                  - link "Toyota" [ref=e206] [cursor=pointer]:
                    - /url: /listings?brand=Toyota
                - listitem [ref=e207]:
                  - link "Ford" [ref=e208] [cursor=pointer]:
                    - /url: /listings?brand=Ford
                - listitem [ref=e209]:
                  - link "BMW" [ref=e210] [cursor=pointer]:
                    - /url: /listings?brand=BMW
            - generic [ref=e211]:
              - heading "Neden OtoBurada?" [level=3] [ref=e212]
              - generic [ref=e213]:
                - generic [ref=e214]:
                  - img [ref=e216]
                  - generic [ref=e218]:
                    - paragraph [ref=e219]: Moderasyon
                    - paragraph [ref=e220]: Tüm ilanlar kontrol edilir
                - generic [ref=e221]:
                  - img [ref=e223]
                  - generic [ref=e228]:
                    - paragraph [ref=e229]: Doğrulanmış
                    - paragraph [ref=e230]: Satıcı kimlikleri teyit edilir
                - generic [ref=e231]:
                  - img [ref=e233]
                  - generic [ref=e235]:
                    - paragraph [ref=e236]: WhatsApp
                    - paragraph [ref=e237]: Direkt iletişim
                - generic [ref=e238]:
                  - img [ref=e240]
                  - generic [ref=e243]:
                    - paragraph [ref=e244]: Ücretsiz
                    - paragraph [ref=e245]: İlan vermek bedava
          - generic [ref=e246]:
            - paragraph [ref=e247]: © 2026 OtoBurada. Tüm hakları saklıdır.
            - generic [ref=e248]:
              - link "Gizlilik Politikası" [ref=e249] [cursor=pointer]:
                - /url: "#"
              - link "Kullanım Şartları" [ref=e250] [cursor=pointer]:
                - /url: "#"
              - link "İletişim" [ref=e251] [cursor=pointer]:
                - /url: "#"
    - navigation "Mobil alt navigasyon" [ref=e252]:
      - list [ref=e253]:
        - listitem [ref=e254]:
          - link "Ana Sayfa" [ref=e255] [cursor=pointer]:
            - /url: /
            - img [ref=e256]
            - text: Ana Sayfa
        - listitem [ref=e259]:
          - link "İlanlar" [ref=e260] [cursor=pointer]:
            - /url: /listings
            - img [ref=e261]
            - text: İlanlar
        - listitem [ref=e264]:
          - link "Giriş" [ref=e265] [cursor=pointer]:
            - /url: /login
            - img [ref=e266]
            - text: Giriş
        - listitem [ref=e269]:
          - link "Kayıt Ol" [ref=e270] [cursor=pointer]:
            - /url: /register
            - img [ref=e271]
            - text: Kayıt Ol
  - alert [ref=e274]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Homepage", () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto("/");
  6   |   });
  7   | 
  8   |   test("should load homepage", async ({ page }) => {
  9   |     await expect(page).toHaveTitle(/Oto Burada/);
  10  |   });
  11  | 
  12  |   test("should show hero section with heading", async ({ page }) => {
  13  |     await expect(page.getByRole("heading", { name: "Hayalindeki Arabayı Bul" })).toBeVisible();
  14  |   });
  15  | 
  16  |   test("should show listing cards", async ({ page }) => {
> 17  |     await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  18  |   });
  19  | });
  20  | 
  21  | test.describe("Listings Page", () => {
  22  |   test.beforeEach(async ({ page }) => {
  23  |     await page.goto("/listings");
  24  |   });
  25  | 
  26  |   test("should load listings page", async ({ page }) => {
  27  |     await expect(page).toHaveURL(/\/listings/);
  28  |   });
  29  | 
  30  |   test("should show save search call-to-action for guests", async ({ page }) => {
  31  |     await expect(page.getByRole("link", { name: /Giris yap ve aramayi kaydet/i })).toBeVisible();
  32  |   });
  33  | });
  34  | 
  35  | test.describe("Listing Detail", () => {
  36  |   test.beforeEach(async ({ page }) => {
  37  |     await page.goto("/listing/2018-volkswagen-golf-1-6-tdi-comfortline");
  38  |   });
  39  | 
  40  |   test("should show listing details", async ({ page }) => {
  41  |     await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
  42  |   });
  43  | 
  44  |   test("should have image", async ({ page }) => {
  45  |     await expect(page.locator("img").first()).toBeVisible({ timeout: 10000 });
  46  |   });
  47  | });
  48  | 
  49  | test.describe("Navigation", () => {
  50  |   test("should navigate to login page", async ({ page }) => {
  51  |     await page.goto("/login");
  52  |     await expect(page).toHaveURL(/login/);
  53  |   });
  54  | 
  55  |   test("should navigate to register page", async ({ page }) => {
  56  |     await page.goto("/register");
  57  |     await expect(page).toHaveURL(/register/);
  58  |   });
  59  | 
  60  |   test("should show compare page", async ({ page }) => {
  61  |     await page.goto("/compare");
  62  |     await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
  63  |   });
  64  | 
  65  |   test("should show public favorites page for guests", async ({ page }) => {
  66  |     await page.goto("/");
  67  |     const favoriteButton = page.locator("button[aria-label='Favorilere ekle']:visible").first();
  68  |     await expect(favoriteButton).toBeEnabled({ timeout: 10000 });
  69  |     await favoriteButton.click();
  70  |     await page.goto("/favorites");
  71  |     await expect(page).toHaveURL(/\/favorites/);
  72  |     await expect(page.getByRole("heading", { name: "Kaydettigin ilanlar" })).toBeVisible();
  73  |     await expect(page.getByText("Favorilerin bu cihazda saklanir")).toBeVisible();
  74  |     await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  75  |   });
  76  | });
  77  | 
  78  | test.describe("API Endpoints", () => {
  79  |   test("GET /api/favorites should work without auth", async ({ request }) => {
  80  |     const res = await request.get("/api/favorites");
  81  |     expect(res.status()).toBe(200);
  82  |     const data = await res.json();
  83  |     expect(data).toMatchObject({
  84  |       success: true,
  85  |       data: {
  86  |         favoriteIds: [],
  87  |       },
  88  |     });
  89  |   });
  90  | 
  91  |   test("POST /api/favorites without auth should return 401", async ({ request }) => {
  92  |     const res = await request.post("/api/favorites", {
  93  |       data: { listingId: "test-id" },
  94  |     });
  95  |     expect(res.status()).toBe(401);
  96  |   });
  97  | 
  98  |   test("GET /api/saved-searches without auth should return 401", async ({ request }) => {
  99  |     const res = await request.get("/api/saved-searches");
  100 |     expect(res.status()).toBe(401);
  101 |   });
  102 | 
  103 |   test("POST /api/saved-searches without auth should return 401", async ({ request }) => {
  104 |     const res = await request.post("/api/saved-searches", {
  105 |       data: {
  106 |         filters: { brand: "Volkswagen", sort: "newest" },
  107 |       },
  108 |     });
  109 |     expect(res.status()).toBe(401);
  110 |   });
  111 | 
  112 |   test("GET /api/notifications without auth should return 401", async ({ request }) => {
  113 |     const res = await request.get("/api/notifications");
  114 |     expect(res.status()).toBe(401);
  115 |   });
  116 | 
  117 |   test("PATCH /api/notifications without auth should return 401", async ({ request }) => {
```