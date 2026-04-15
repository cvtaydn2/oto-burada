# Listing Submission Flow Fix — Bugfix Design

## Overview

İlan oluşturma akışında tespit edilen 5 kritik hata, kullanıcıların ilan yayınlamasını tamamen engellemektedir. Bu doküman her hatanın kök nedenini, tam kod değişikliğini ve test stratejisini tanımlar.

Hatalar:
1. `buildListingRecord` içinde `viewCount` alanının `listingSchema.parse()` çağrısına dahil edilmemesi → Zod NaN hatası
2. `support.ts` içinde `profiles` join sorgusunda var olmayan `email` kolonu → DB hatası
3. `lookupVehicleByPlate` server action'ının client component'ten doğrudan çağrılması → plaka sorgulama çalışmıyor
4. `ExpertInspectionEditor` grid container'ının overflow kısıtlaması → sağ sütun görünmüyor
5. `onSubmit` handler'ında `router.push` yerine `router.refresh` kullanılması ve email verification bloğu → ilan yayınlanamıyor

---

## Glossary

- **Bug_Condition (C)**: Hatayı tetikleyen koşul — her hata için ayrı `isBugCondition` fonksiyonu ile tanımlanır
- **Property (P)**: Düzeltilmiş kodun sağlaması gereken davranış
- **Preservation**: Düzeltme sonrasında değişmemesi gereken mevcut davranışlar
- **buildListingRecord**: `src/services/listings/listing-submissions.ts` içinde yeni ilan kaydı oluşturan fonksiyon
- **mapListingRow**: Aynı dosyada DB satırını `Listing` tipine dönüştüren fonksiyon
- **listingSchema**: `src/lib/validators/domain.ts` içinde `viewCount: z.coerce.number().int().min(0)` alanını zorunlu tutan Zod şeması
- **getSupportTickets**: `src/services/admin/support.ts` içinde destek taleplerini listeleyen fonksiyon
- **lookupVehicleByPlate**: `src/services/listings/plate-lookup.ts` içinde `"use server"` direktifli server action
- **ExpertInspectionEditor**: `src/components/forms/expert-inspection-editor.tsx` içinde ekspertiz form bileşeni
- **isEmailVerifiedLocally**: `listing-create-form.tsx` içinde email doğrulama durumunu tutan state

---

## Bug Details

### Bug 1 — viewCount NaN

`buildListingRecord` fonksiyonu `listingSchema.parse()` çağrısına `viewCount` alanını geçirmemektedir. `listingSchema` içinde `viewCount: z.coerce.number().int().min(0)` zorunlu bir alan olarak tanımlıdır. Alan geçilmediğinde `z.coerce.number()` `undefined`'ı `NaN`'a dönüştürür ve validasyon başarısız olur.

**Formal Specification:**
```
FUNCTION isBugCondition_viewCount(input)
  INPUT: input of type ListingCreateInput
  OUTPUT: boolean

  RETURN buildListingRecord(input) calls listingSchema.parse(record)
         AND record does NOT contain viewCount field
END FUNCTION
```

**Örnekler:**
- Yeni ilan oluşturma: `buildListingRecord(input, sellerId, [])` → `ZodError: viewCount: Invalid input: expected number, received NaN`
- Mevcut ilan güncelleme: `buildUpdatedListing(input, existingListing, listings)` → aynı hata (aynı `buildListingRecord` çağrısı)
- `mapListingRow` içinde: `row.view_count` DB'den `null` geldiğinde `viewCount: row.view_count ?? 0` → `0` döner, bu kısım zaten doğru

---

### Bug 2 — profiles.email Kolon Hatası

`getSupportTickets` fonksiyonu `profiles(full_name, email)` join sorgusunu çalıştırmaktadır. Supabase Auth mimarisinde `email` kolonu `profiles` tablosunda değil, `auth.users` tablosundadır. Bu nedenle sorgu `{"code":"42703","message":"column profiles_1.email does not exist"}` hatası döndürür.

**Formal Specification:**
```
FUNCTION isBugCondition_profilesEmail(query)
  INPUT: query of type SupabaseSelectQuery
  OUTPUT: boolean

  RETURN query.table = "profiles"
         AND "email" IN query.selectedColumns
END FUNCTION
```

**Örnekler:**
- `admin.from("tickets").select("..., profiles(full_name, email)")` → DB hatası, boş array döner
- Admin destek paneli açıldığında tüm ticket listesi boş görünür
- Ticket'a yanıt verilmek istendiğinde email alınamadığı için bildirim gönderilemez

---

### Bug 3 — Plaka Sorgulama Çalışmıyor

`lookupVehicleByPlate` fonksiyonu `"use server"` direktifi ile işaretlenmiş bir server action'dır. `listing-create-form.tsx` içinde doğrudan `import` edilerek client component'ten çağrılmaktadır. Next.js App Router'da server action'lar form action veya `startTransition` ile çağrılmalıdır; ancak mevcut implementasyonda `handlePlateLookup` async handler içinde doğrudan `await lookupVehicleByPlate(plate)` çağrısı yapılmaktadır.

Ek olarak, `lookupVehicleByPlate` içinde `brands` tablosuna `is_active = true` filtresiyle sorgu yapılmaktadır. Eğer `brands` tablosunda `is_active` kolonu yoksa veya tüm kayıtlar `false` ise sorgu boş döner.

**Formal Specification:**
```
FUNCTION isBugCondition_plateLookup(state)
  INPUT: state of type { plate: string, context: "client-component" }
  OUTPUT: boolean

  RETURN state.context = "client-component"
         AND lookupVehicleByPlate is marked "use server"
         AND call is NOT wrapped in server action form binding
END FUNCTION
```

**Örnekler:**
- Kullanıcı "34 ABC 123" girip "Sorgula" tıklar → network isteği gitmez veya hata döner
- `brands` tablosunda `is_active` kolonu yoksa → `null` döner, "Bu plaka ile araç bilgisi bulunamadı" hatası gösterilir

---

### Bug 4 — Ekspertiz Formu Sağ Sütun Görünmüyor

`ExpertInspectionEditor` içindeki "Teknik Aksam Durumları" grid'i `grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8` sınıflarıyla tanımlanmıştır. Grid container'ı `bg-muted/30 rounded-2xl p-6 border border-border/50` sınıflı bir `div` içindedir. Bu container'ın parent'ı olan `InspectionStep` → `FormSection` zincirinde bir `overflow-hidden` veya sabit genişlik kısıtlaması sağ sütunun görünür alanın dışında kalmasına neden olmaktadır.

Alternatif olarak: `sm:` breakpoint'i (640px) form container'ının `max-w-[1000px]` genişliğinde tetiklenmeyebilir; `FormSection` bileşeni içinde `max-w-xs` veya benzeri bir kısıtlama olabilir.

**Formal Specification:**
```
FUNCTION isBugCondition_expertGrid(viewport)
  INPUT: viewport of type { width: number, containerWidth: number }
  OUTPUT: boolean

  RETURN viewport.width >= 640
         AND INSPECTION_FIELDS renders in grid-cols-2
         AND rightColumnFields NOT visible in rendered output
END FUNCTION
```

**Örnekler:**
- Desktop (1280px): "Teknik Aksam Durumları" bölümünde yalnızca sol sütun (Hasar Kaydı, Motor, Yol Tutuş, Elektronik, Lastik) görünür
- Sağ sütun (Şanzıman, Fren, İç Kondisyon, Klima) render edilmez veya overflow nedeniyle gizlenir
- Mobile (375px): `grid-cols-1` olduğu için tüm alanlar görünür — sorun yalnızca sm+ breakpoint'te

---

### Bug 5 — İlan Yayınla Butonu Çalışmıyor

İki ayrı sorun birlikte bu hatayı oluşturmaktadır:

**5a — Email Verification Bloğu:** `isEmailVerifiedLocally` state'i `useState(isEmailVerified || isPhoneVerified)` ile başlatılmaktadır. Eğer kullanıcının email'i doğrulanmamışsa `onSubmit` handler'ı `setIsVerifyDialogOpen(true)` çağırıp `return` eder. Kullanıcı dialog'u kapattıktan sonra `onSuccess` callback'i `onSubmit()` çağırır; ancak bu çağrı `handleSubmit` wrapper'ı olmadan yapıldığı için form değerlerini doğru şekilde geçirmez.

**5b — router.refresh vs router.push:** Başarılı submit sonrasında `isEditing` false olduğunda yalnızca `router.refresh()` çağrılmaktadır. Bu kullanıcıyı ilan oluşturma sayfasında bırakır; `/dashboard/listings` sayfasına yönlendirme yapılmaz.

**Formal Specification:**
```
FUNCTION isBugCondition_submitButton(state)
  INPUT: state of type { isEmailVerifiedLocally: boolean, allFieldsValid: boolean }
  OUTPUT: boolean

  RETURN state.isEmailVerifiedLocally = false
         OR (submitSuccess = true AND router.push NOT called)
END FUNCTION
```

**Örnekler:**
- Email doğrulanmamış kullanıcı "İlanı Yayınla" tıklar → dialog açılır, kapanır, tekrar tıklar → form submit edilmez
- Email doğrulanmış kullanıcı submit eder, API 201 döner → kullanıcı aynı sayfada kalır, başarı mesajı 3 saniye sonra kaybolur

---

## Expected Behavior

### Preservation Requirements

**Değişmemesi Gereken Davranışlar:**
- Mevcut onaylı ilanların `viewCount` değerleri doğru gösterilmeye devam etmeli
- `mapListingRow` içindeki `viewCount: row.view_count ?? 0` ifadesi değişmemeli
- Destek talebi oluşturma ve listeleme (email olmadan) çalışmaya devam etmeli
- Plaka alanı boş bırakıldığında form submit edilebilmeli (plaka opsiyonel)
- Ekspertiz "YOK" seçildiğinde form ekspertiz alanları olmadan submit edilebilmeli
- İlan düzenleme (edit) akışı `router.replace("/dashboard/listings")` ile çalışmaya devam etmeli
- Fraud score hesaplama, slug oluşturma, `pending` statüsüyle kaydetme değişmemeli

**Kapsam:**
Bug condition'ları dışındaki tüm input'lar (mevcut ilanları listeleme, favoriler, admin moderasyon) bu düzeltmelerden etkilenmemelidir.

---

## Hypothesized Root Cause

### Bug 1 — viewCount NaN
`buildListingRecord` fonksiyonu `listingSchema.parse()` çağrısına geçirilen nesneye `viewCount` alanını dahil etmemiştir. `listingSchema` içinde `viewCount: z.coerce.number().int().min(0)` zorunlu (non-optional) olarak tanımlıdır. `z.coerce.number()` `undefined` değerini `NaN`'a dönüştürür ve `min(0)` validasyonu başarısız olur.

### Bug 2 — profiles.email
Supabase Auth mimarisinde kullanıcı email'i `auth.users` tablosundadır, `public.profiles` tablosunda değildir. Geliştirici `profiles` tablosuna `email` kolonu eklendiğini varsayarak join sorgusuna dahil etmiştir.

### Bug 3 — Plaka Sorgulama
Next.js App Router'da `"use server"` direktifli fonksiyonlar client component'ten doğrudan import edilip çağrılabilir; ancak bu çağrı bir HTTP POST isteğine dönüştürülür. Sorun muhtemelen `brands` tablosundaki `is_active` kolonunun mevcut olmaması veya tüm kayıtların `is_active = false` olmasıdır. Alternatif olarak server action çağrısı network katmanında başarısız oluyordur.

### Bug 4 — Ekspertiz Grid
`FormSection` bileşeni veya parent container'lardan biri `overflow-hidden` içeriyor olabilir. Alternatif olarak `sm:grid-cols-2` breakpoint'i container query yerine viewport genişliğine göre çalışıyor ve form container'ı `sm` breakpoint'i tetiklemeyecek kadar dar olabilir.

### Bug 5 — Submit Butonu
`onSuccess` callback'i `onSubmit()` fonksiyonunu doğrudan çağırmaktadır; ancak `onSubmit` aslında `handleSubmit(async (values) => {...})` döndürdüğü bir fonksiyondur. `handleSubmit` wrapper'ı form event'ini bekler; doğrudan çağrıldığında `values` parametresi `undefined` olabilir. `router.refresh()` ise sayfayı yeniler ama yönlendirme yapmaz.

---

## Correctness Properties

Property 1: Bug Condition — viewCount Zod Validasyonu

_For any_ `ListingCreateInput` where `buildListingRecord` is called, the fixed function SHALL include `viewCount: 0` in the `listingSchema.parse()` call, ensuring no ZodError is thrown and the returned listing has `viewCount === 0`.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition — profiles.email DB Hatası

_For any_ call to `getSupportTickets`, the fixed query SHALL NOT select the `email` column from the `profiles` table, ensuring no `42703` DB error is thrown and tickets are returned successfully.

**Validates: Requirements 2.3, 2.4**

Property 3: Bug Condition — Plaka Sorgulama

_For any_ valid Turkish license plate input where the user clicks "Sorgula", the fixed implementation SHALL return vehicle data and populate the form fields, or return a user-friendly error if no data is found.

**Validates: Requirements 2.5, 2.6**

Property 4: Bug Condition — Ekspertiz Grid Layout

_For any_ viewport width >= 640px where `hasInspection = true`, the fixed `ExpertInspectionEditor` SHALL render all 10 `INSPECTION_FIELDS` in a two-column layout with both columns visible.

**Validates: Requirements 2.7, 2.8**

Property 5: Bug Condition — Submit Butonu Yönlendirme

_For any_ form submission where all required fields are valid and `isEmailVerifiedLocally = true`, the fixed `onSubmit` handler SHALL call `router.push("/dashboard/listings")` after a successful API response.

**Validates: Requirements 2.9, 2.10**

Property 6: Preservation — Mevcut Davranışlar

_For any_ input where none of the bug conditions hold (existing approved listings, edit flow, inspection "YOK" selection, non-plate form submissions), the fixed code SHALL produce exactly the same behavior as the original code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

---

## Fix Implementation

### Bug 1 — viewCount: `src/services/listings/listing-submissions.ts`

**Fonksiyon:** `buildListingRecord`

**Değişiklik:** `listingSchema.parse({...})` çağrısına `viewCount: 0` ekle.

```diff
  return listingSchema.parse({
    id,
    slug,
    sellerId,
+   viewCount: existingListing?.viewCount ?? 0,
    title: input.title,
    // ... diğer alanlar
  });
```

`existingListing` varsa mevcut `viewCount` korunur, yeni ilan için `0` kullanılır.

---

### Bug 2 — profiles.email: `src/services/admin/support.ts`

**Fonksiyon:** `getSupportTickets`

**Değişiklik 1:** Join sorgusundan `email` kolonunu kaldır.

```diff
  const { data, error } = await admin
    .from("tickets")
-   .select("id, subject, description, status, priority, created_at, profiles(full_name, email)")
+   .select("id, subject, description, status, priority, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });
```

**Değişiklik 2:** `SupportTicketRow` interface'inden `email` kaldır.

```diff
  interface SupportTicketRow {
    // ...
-   profiles?: Array<{ email: string; full_name: string }> | { email: string; full_name: string } | null;
+   profiles?: Array<{ full_name: string }> | { full_name: string } | null;
  }
```

**Değişiklik 3:** Email gerektiğinde `admin.auth.admin.getUserById()` ile al. Ticket'a yanıt verilirken kullanılacak yardımcı fonksiyon:

```typescript
export async function getUserEmailById(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}
```

---

### Bug 3 — Plaka Sorgulama: `src/services/listings/plate-lookup.ts`

**Sorun:** `brands` tablosunda `is_active` kolonu yoksa sorgu boş döner.

**Değişiklik:** `is_active` filtresini kaldır veya opsiyonel yap; fallback ekle.

```diff
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
-   .eq("is_active", true)
    .limit(20);
```

```diff
  const { data: models } = await supabase
    .from("models")
    .select("name")
    .eq("brand_id", selectedBrand.id)
-   .eq("is_active", true)
    .limit(10);
```

**Not:** `lookupVehicleByPlate` Next.js App Router'da client component'ten doğrudan import edilip çağrılabilir — bu desteklenen bir pattern'dir. Asıl sorun `is_active` filtresidir.

---

### Bug 4 — Ekspertiz Grid: `src/components/forms/expert-inspection-editor.tsx`

**Sorun:** `sm:grid-cols-2` breakpoint container genişliğine göre çalışmıyor veya parent'ta overflow kısıtlaması var.

**Değişiklik:** `sm:` yerine `md:` breakpoint kullan ve `overflow-visible` ekle.

```diff
- <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
+ <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 overflow-visible">
```

Ayrıca container `div`'ine `overflow-visible` ekle:

```diff
- <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
+ <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 overflow-visible">
```

---

### Bug 5 — Submit Butonu: `src/components/forms/listing-create-form.tsx`

**Değişiklik 1:** Başarılı submit sonrasında `router.push` ekle.

```diff
  setSubmitState({ message: "İlan başarıyla kaydedildi.", status: "success" });
  if (isEditing) router.replace("/dashboard/listings");
- router.refresh();
+ else router.push("/dashboard/listings");
```

**Değişiklik 2:** `PhoneVerificationDialog` `onSuccess` callback'ini düzelt — `onSubmit()` yerine `isEmailVerifiedLocally` state'ini güncelle ve form'u yeniden submit et.

```diff
  <PhoneVerificationDialog
    isOpen={isVerifyDialogOpen}
    onOpenChange={setIsVerifyDialogOpen}
    onSuccess={() => {
      setIsEmailVerifiedLocally(true);
      setIsVerifyDialogOpen(false);
-     onSubmit();
+     // onSubmit form event'i olmadan çağrılamaz; kullanıcı butona tekrar basacak
+     // Alternatif: form.handleSubmit ile programatik submit
+     form.handleSubmit(async (values) => {
+       // submit logic burada tekrarlanır veya ayrı bir fonksiyona çıkarılır
+     })();
    }}
  />
```

**Daha temiz yaklaşım:** Submit logic'ini ayrı bir `submitListing` fonksiyonuna çıkar, hem `onSubmit` hem `onSuccess` callback'inden çağır:

```typescript
const submitListing = async (values: ListingCreateFormValues) => {
  clearErrors();
  setSubmitState(initialSubmitState);
  try {
    const response = await fetch(
      isEditing ? `/api/listings/${initialListing?.id}` : "/api/listings",
      { body: JSON.stringify(values), headers: { "Content-Type": "application/json" }, method: isEditing ? "PATCH" : "POST" }
    );
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      const fieldErrors = payload?.error?.fieldErrors as Record<string, string> | undefined;
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as Parameters<typeof setError>[0], { message });
        });
      }
      setSubmitState({ message: payload?.error?.message ?? "Bir hata oluştu.", status: "error" });
      return;
    }
    setSubmitState({ message: "İlan başarıyla kaydedildi.", status: "success" });
    if (isEditing) router.replace("/dashboard/listings");
    else router.push("/dashboard/listings");
  } catch {
    setSubmitState({ message: "Bağlantı hatası.", status: "error" });
  }
};

const onSubmit = handleSubmit(async (values) => {
  if (!isEmailVerifiedLocally) {
    setIsVerifyDialogOpen(true);
    return;
  }
  await submitListing(values);
});
```

Ve `onSuccess` callback'i:

```typescript
onSuccess={() => {
  setIsEmailVerifiedLocally(true);
  setIsVerifyDialogOpen(false);
  form.handleSubmit(submitListing)();
}}
```

---

## Testing Strategy

### Validation Approach

İki aşamalı yaklaşım: önce düzeltilmemiş kodda bug'ı gösteren counterexample'lar üret, sonra düzeltmenin doğruluğunu ve preservation'ı doğrula.

---

### Exploratory Bug Condition Checking

**Hedef:** Düzeltme öncesinde bug'ların varlığını kanıtla.

**Test Planı:**

1. **viewCount NaN Testi** (unfixed'te başarısız olur)
   - `buildListingRecord` fonksiyonunu minimal input ile çağır
   - `listingSchema.parse()` çağrısının `ZodError` fırlattığını assert et
   - Beklenen hata: `viewCount: Invalid input: expected number, received NaN`

2. **profiles.email DB Testi** (unfixed'te başarısız olur)
   - `getSupportTickets()` fonksiyonunu çağır
   - Supabase'in `42703` hata kodu döndürdüğünü assert et
   - Beklenen: boş array döner, hata loglanır

3. **Plaka Sorgulama Testi** (unfixed'te başarısız olabilir)
   - `lookupVehicleByPlate("34ABC123")` çağır
   - `brands` tablosunda `is_active` filtresiyle sorgu yapıldığında `null` döndüğünü assert et

4. **Ekspertiz Grid Testi** (unfixed'te başarısız olur)
   - `ExpertInspectionEditor` render et, `hasInspection = true` set et
   - Sağ sütun elementlerinin (`getByText("Şanzıman / Vites Geçişleri")` vb.) DOM'da mevcut ama görünmez olduğunu assert et

5. **Submit Yönlendirme Testi** (unfixed'te başarısız olur)
   - `router.push` mock'la
   - Başarılı API response sonrasında `router.push` çağrılmadığını assert et

**Beklenen Counterexample'lar:**
- `buildListingRecord` → `ZodError: viewCount NaN`
- `getSupportTickets` → `PostgrestError: column profiles_1.email does not exist`
- `lookupVehicleByPlate` → `null` (is_active filtresi)
- Submit → `router.push` çağrılmaz

---

### Fix Checking

**Hedef:** Bug condition'ı sağlayan tüm input'lar için düzeltilmiş fonksiyonun beklenen davranışı ürettiğini doğrula.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Planı:**

1. `buildListingRecord` → `result.viewCount === 0`, Zod hatası yok
2. `getSupportTickets` → DB hatası yok, ticket array döner
3. `lookupVehicleByPlate("34ABC123")` → `PlateLookupResult` döner (null değil)
4. `ExpertInspectionEditor` render → tüm 10 alan görünür
5. Submit → `router.push("/dashboard/listings")` çağrılır

---

### Preservation Checking

**Hedef:** Bug condition'ı sağlamayan input'lar için davranışın değişmediğini doğrula.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Test Planı:**

1. **viewCount Preservation:** Mevcut ilan güncellendiğinde `viewCount` mevcut değeri korunur
2. **profiles Preservation:** `getSupportTickets` `full_name` alanını doğru döndürür
3. **Plaka Opsiyonel:** Plaka girilmeden form submit edilebilir
4. **Ekspertiz YOK:** `hasInspection = false` seçildiğinde grid render edilmez, form submit edilebilir
5. **Edit Akışı:** `isEditing = true` durumunda `router.replace("/dashboard/listings")` çağrılır

---

### Unit Tests

- `buildListingRecord` → `viewCount: 0` içerdiğini ve Zod validasyonunu geçtiğini test et
- `buildListingRecord` → `existingListing.viewCount = 42` olduğunda `viewCount: 42` döndürdüğünü test et
- `getSupportTickets` → `email` kolonu olmadan sorgu çalıştığını test et
- `lookupVehicleByPlate` → geçersiz plaka formatında `null` döndürdüğünü test et
- `lookupVehicleByPlate` → geçerli plaka formatında `PlateLookupResult` döndürdüğünü test et
- `submitListing` → başarılı response sonrasında `router.push` çağrıldığını test et

### Property-Based Tests

- Rastgele `ListingCreateInput` üret → `buildListingRecord` her zaman `viewCount >= 0` döndürür
- Rastgele ticket verisi üret → `getSupportTickets` her zaman `email` içermeyen profil döndürür
- Rastgele form state üret → `isEmailVerifiedLocally = true` ve valid form → `router.push` çağrılır

### Integration Tests

- Tam ilan oluşturma akışı: 4 adımı tamamla → "İlanı Yayınla" tıkla → `/dashboard/listings`'e yönlendir
- Admin destek paneli: ticket listesi yüklenir, `full_name` görünür
- Plaka sorgulama: geçerli plaka gir → form alanları dolar
- Ekspertiz formu: "VAR" seç → tüm 10 alan görünür ve doldurulabilir
