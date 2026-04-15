# Bugfix Requirements Document

## Introduction

"İlan ver" akışında tespit edilen 5 kritik hata, kullanıcıların ilan oluşturmasını tamamen engellemektedir. Hatalar sırasıyla: Zod validasyonunda `viewCount` NaN hatası, `profiles` tablosundan var olmayan `email` kolonu çekilmeye çalışılması, plaka/şasi sorgulama işlevinin çalışmaması, ekspertiz formunun sağ tarafının görünmemesi ve "İlan Yayınla" butonunun hiçbir şey yapmamasıdır. Bu beş hata birlikte ilan oluşturma akışını kullanılamaz hale getirmektedir.

---

## Bug Analysis

### Current Behavior (Defect)

**Hata 1 — viewCount NaN (Zod Validasyon Hatası)**

1.1 WHEN `buildListingRecord` fonksiyonu yeni bir ilan kaydı oluştururken `viewCount` alanı `listingSchema.parse()` içine geçirilmediğinde THEN sistem `ZodError: Invalid input: expected number, received NaN` hatası fırlatır ve ilan kaydedilemez.

1.2 WHEN `mapListingRow` fonksiyonu DB'den dönen satırı `Listing` tipine dönüştürürken `view_count` kolonu `undefined` veya `null` olduğunda THEN `viewCount: row.view_count ?? 0` ifadesi `0` döndürse de `listingSchema.parse()` çağrısında `viewCount` alanı eksik olduğu için NaN olarak işlenir.

**Hata 2 — profiles_1.email Kolon Hatası**

1.3 WHEN `getAllTickets` veya `updateTicketStatus` fonksiyonu `profiles!tickets_user_id_fkey(full_name, email)` join sorgusunu çalıştırdığında THEN Supabase `{"code":"42703","message":"column profiles_1.email does not exist"}` hatası döndürür çünkü `email` kolonu `profiles` tablosunda değil, Supabase Auth sistemindedir.

1.4 WHEN `mapTicketWithProfile` fonksiyonu `profile?.email` alanını okumaya çalıştığında THEN `profiles` tablosunda bu kolon bulunmadığından `userEmail` her zaman `null` olur ve admin ticket yanıtlarında kullanıcıya e-posta gönderilemez.

**Hata 3 — Plaka/Şasi Sorgulama Çalışmıyor**

1.5 WHEN kullanıcı ilan oluşturma formunun 1. adımında plaka girerek "Sorgula" butonuna bastığında THEN `lookupVehicleByPlate` server action'ı `"use server"` direktifi ile işaretlenmiş olmasına rağmen client component içinden doğrudan çağrıldığı için araç bilgileri forma dolmaz.

1.6 WHEN `lookupVehicleByPlate` fonksiyonu geçerli bir plaka formatı için `brands` tablosunu sorguladığında THEN `brands` tablosunun `is_active` kolonu veya `models` tablosunun yapısı beklenen şemadan farklıysa sorgu boş sonuç döndürür ve kullanıcıya "Bu plaka ile araç bilgisi bulunamadı" hatası gösterilir.

**Hata 4 — Ekspertiz Formu Sağ Tarafı Eksik**

1.7 WHEN kullanıcı ilan oluşturma formunun 3. adımında (InspectionStep) ekspertiz bölümüne geldiğinde THEN `ExpertInspectionEditor` bileşenindeki "Teknik Aksam Durumları" grid'i `grid-cols-1 sm:grid-cols-2` sınıfıyla tanımlanmış olmasına rağmen yalnızca sol sütun görünür, sağ sütundaki alanlar (Şanzıman, Yol Tutuş, Fren, Elektronik, İç Kondisyon, Lastik, Klima) ekranda render edilmez veya görünmez.

1.8 WHEN `INSPECTION_FIELDS` dizisindeki 10 alan `grid` layout içinde render edildiğinde THEN responsive breakpoint veya container genişliği kısıtlaması nedeniyle sağ sütun alanları görünür alanın dışında kalır.

**Hata 5 — İlan Yayınla Butonu Çalışmıyor**

1.9 WHEN kullanıcı tüm 4 adımı tamamlayıp son adımda "İlanı Yayınla" butonuna bastığında THEN `onSubmit` handler'ı `isEmailVerifiedLocally` kontrolünde `false` döndürerek `PhoneVerificationDialog`'u açar ve form submit edilmez; kullanıcı doğrulama diyaloğunu kapattıktan sonra tekrar butona basması gerekir ancak bu da çalışmaz.

1.10 WHEN `POST /api/listings` isteği başarıyla tamamlandığında THEN `router.push("/dashboard/listings")` yerine yalnızca `router.refresh()` çağrıldığı için kullanıcı ilan oluşturma sayfasında kalır ve başarı mesajı görmez; ilan oluşturulmuş olsa bile kullanıcı bunu anlayamaz.

---

### Expected Behavior (Correct)

**Hata 1 — viewCount NaN Düzeltmesi**

2.1 WHEN `buildListingRecord` fonksiyonu yeni bir ilan kaydı oluştururken THEN sistem `viewCount: 0` değerini `listingSchema.parse()` çağrısına dahil etmeli ve Zod validasyonu başarıyla geçmelidir.

2.2 WHEN `mapListingRow` fonksiyonu DB satırını dönüştürdüğünde THEN `viewCount: row.view_count ?? 0` ifadesi her zaman geçerli bir sayı döndürmeli ve `listingSchema` validasyonunu geçmelidir.

**Hata 2 — profiles_1.email Kolon Hatası Düzeltmesi**

2.3 WHEN `getAllTickets` ve `updateTicketStatus` fonksiyonları `profiles` join sorgusunu çalıştırdığında THEN sorgu yalnızca `profiles!tickets_user_id_fkey(full_name)` şeklinde `email` kolonu olmadan çalışmalı ve DB hatası fırlatmamalıdır.

2.4 WHEN admin ticket yanıtlarında kullanıcıya e-posta gönderilmesi gerektiğinde THEN sistem `getUserEmailAndName` fonksiyonu aracılığıyla `admin.auth.admin.getUserById()` üzerinden kullanıcının e-posta adresini almalı ve e-posta başarıyla gönderilmelidir.

**Hata 3 — Plaka/Şasi Sorgulama Düzeltmesi**

2.5 WHEN kullanıcı geçerli formatta bir plaka girip "Sorgula" butonuna bastığında THEN sistem araç bilgilerini başarıyla getirmeli ve marka, model, yıl, yakıt tipi, vites tipi alanlarını otomatik olarak forma doldurmalıdır.

2.6 WHEN `lookupVehicleByPlate` çağrısı başarılı olduğunda THEN form alanları `setValue` ile güncellenmeli ve kullanıcıya "Araç bilgileri başarıyla getirildi" mesajı gösterilmelidir.

**Hata 4 — Ekspertiz Formu Sağ Tarafı Düzeltmesi**

2.7 WHEN kullanıcı ekspertiz bölümünde "VAR" seçeneğini seçtiğinde THEN "Teknik Aksam Durumları" grid'indeki tüm 10 alan (Hasar Kaydı, Kaporta & Boya, Motor, Şanzıman, Yol Tutuş, Fren, Elektronik, İç Kondisyon, Lastik, Klima) görünür olmalı ve iki sütunlu düzende doğru şekilde render edilmelidir.

2.8 WHEN ekspertiz formu farklı ekran boyutlarında görüntülendiğinde THEN tüm alanlar erişilebilir ve kullanılabilir olmalıdır.

**Hata 5 — İlan Yayınla Butonu Düzeltmesi**

2.9 WHEN kullanıcı tüm zorunlu alanları doldurmuş ve en az 3 fotoğraf yüklemiş durumdayken "İlanı Yayınla" butonuna bastığında THEN form `POST /api/listings` endpoint'ine submit edilmeli ve ilan `pending` statüsüyle veritabanına kaydedilmelidir.

2.10 WHEN ilan başarıyla kaydedildiğinde THEN kullanıcı `/dashboard/listings` sayfasına yönlendirilmeli ve admin panelindeki "Bekleyen İlanlar" listesinde ilan görünmelidir.

2.11 WHEN admin bekleyen ilanı onayladığında THEN ilan `approved` statüsüne geçmeli, kullanıcıya bildirim gönderilmeli ve ilan public listede görünür hale gelmelidir.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN kullanıcı geçerli bir ilan formu doldurduğunda THEN sistem SHALL CONTINUE TO formu Zod şemasıyla doğrulamayı ve geçersiz alanlar için hata mesajları göstermeyi sürdürmelidir.

3.2 WHEN mevcut onaylı ilanlar listelendiğinde THEN sistem SHALL CONTINUE TO `viewCount` değerini doğru şekilde göstermeyi ve sıralamayı sürdürmelidir.

3.3 WHEN kullanıcı destek talebi (ticket) oluşturduğunda THEN sistem SHALL CONTINUE TO ticket'ı veritabanına kaydetmeyi ve kullanıcıya onay e-postası göndermeyi sürdürmelidir.

3.4 WHEN admin bir destek talebine yanıt verdiğinde THEN sistem SHALL CONTINUE TO ticket durumunu güncellemeyi ve kullanıcıya e-posta bildirimi göndermeyi sürdürmelidir.

3.5 WHEN kullanıcı ilan oluşturma formunda şasi numarası (VIN) girdiğinde THEN sistem SHALL CONTINUE TO 17 karakter uzunluğu ve format validasyonunu uygulamayı sürdürmelidir.

3.6 WHEN ekspertiz bölümünde "YOK" seçeneği seçildiğinde THEN sistem SHALL CONTINUE TO ekspertiz alanlarını gizlemeyi ve formu ekspertiz olmadan submit etmeye izin vermeyi sürdürmelidir.

3.7 WHEN ilan submit edildiğinde THEN sistem SHALL CONTINUE TO fraud score hesaplamayı, slug oluşturmayı ve ilanı `pending` statüsüyle kaydetmeyi sürdürmelidir.

3.8 WHEN admin bir ilanı onayladığında THEN sistem SHALL CONTINUE TO moderasyon aksiyonu kaydını oluşturmayı, kullanıcıya bildirim göndermeyi ve cache'i geçersiz kılmayı sürdürmelidir.

---

## Bug Condition Pseudocode

### Hata 1 — viewCount NaN

```pascal
FUNCTION isBugCondition_viewCount(X)
  INPUT: X of type ListingCreateInput
  OUTPUT: boolean
  
  RETURN buildListingRecord(X) does NOT include viewCount field in parse call
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_viewCount(X) DO
  result ← buildListingRecord'(X)
  ASSERT result.viewCount = 0 AND no_zod_error(result)
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_viewCount(X) DO
  ASSERT buildListingRecord(X) = buildListingRecord'(X)
END FOR
```

### Hata 2 — profiles.email Kolon Hatası

```pascal
FUNCTION isBugCondition_profilesEmail(Q)
  INPUT: Q of type SupabaseQuery
  OUTPUT: boolean
  
  RETURN Q selects "email" column FROM "profiles" table via join
END FUNCTION

// Property: Fix Checking
FOR ALL Q WHERE isBugCondition_profilesEmail(Q) DO
  result ← executeQuery'(Q)
  ASSERT no_db_error(result) AND result.code != "42703"
END FOR
```

### Hata 5 — İlan Yayınla Butonu

```pascal
FUNCTION isBugCondition_submitButton(S)
  INPUT: S of type FormSubmitState
  OUTPUT: boolean
  
  RETURN S.isEmailVerifiedLocally = false AND S.allFieldsValid = true
END FUNCTION

// Property: Fix Checking
FOR ALL S WHERE NOT isBugCondition_submitButton(S) DO
  result ← onSubmit'(S)
  ASSERT result.status = 201 AND result.listing.status = "pending"
END FOR
```
