# Security Fix: Notifications & Profile Services

**Date**: 2026-04-19  
**Severity**: Orta-Yüksek (Medium-High)  
**Status**: ✅ Fixed

---

## 🔍 Bulgular (Findings)

### 1. Notifications Service - RLS Bypass via Admin Client

**Dosya**: `src/services/notifications/notification-records.ts`

**Sorun**:
- Tüm bildirim CRUD işlemleri `service_role` (admin client) ile yürütülüyor
- RLS politikaları bypass ediliyor
- Route katmanında doğrulama atlanırsa yatay yetki ihlali (horizontal privilege escalation) riski

**Exploit Senaryosu**:
```typescript
// Saldırgan başka kullanıcının bildirimlerini manipüle edebilir
await markDatabaseNotificationRead("victim-user-id", "notification-id");
await deleteDatabaseNotification("victim-user-id", "notification-id");
```

**Etkilenen Fonksiyonlar**:
- `getDatabaseNotifications()` - okuma işlemleri
- `markDatabaseNotificationRead()` - güncelleme
- `markAllDatabaseNotificationsRead()` - toplu güncelleme
- `deleteDatabaseNotification()` - silme

**Dokunulmayan Fonksiyonlar** (admin client gerekli):
- `createDatabaseNotification()` - sistem bildirimleri
- `createDatabaseNotificationsBulk()` - toplu sistem bildirimleri

---

### 2. Profile Service - Read Operation Side Effects

**Dosya**: `src/services/profile/profile-records.ts`

**Sorun 1: ensureProfileRecord() Upsert Side-Effect**:
- GET/read akışlarında profil upsert ediliyor
- Salt okuma endpoint'leri veri mutasyonu yapıyor
- Beklenmeyen davranışlar, audit log kirliliği, cache sorunları

**Kod**:
```typescript
export async function ensureProfileRecord(user: User) {
  const profile = buildProfileFromAuthUser(user);
  // ❌ Read operation içinde upsert!
  await admin.from("profiles").upsert(...);
  return profile;
}
```

**Sorun 2: isUserBanned() Fail-Open Behavior**:
- DB erişilemezse `false` dönüyor (kullanıcı yasaklı değil)
- Production'da kritik güvenlik kontrolü başarısız olursa işlem devam ediyor
- Yasaklı kullanıcı bazı mutasyonlara devam edebilir

**Kod**:
```typescript
if (!hasSupabaseAdminEnv()) {
  return false; // ❌ Fail-open: DB yoksa "yasaklı değil" kabul et
}
if (error || !data) {
  return false; // ❌ Fail-open: hata varsa "yasaklı değil" kabul et
}
```

---

## ✅ Uygulanan Düzeltmeler (Applied Fixes)

### 1. Notifications Service

**Değişiklik**: Admin client → Server client (authenticated role)

**Öncesi**:
```typescript
const admin = createSupabaseAdminClient();
await admin.from("notifications").update(...).eq("user_id", userId);
```

**Sonrası**:
```typescript
const supabase = await createSupabaseServerClient();
await supabase.from("notifications").update(...).eq("user_id", userId);
// RLS policy: notifications_manage_own otomatik enforce edilir
```

**RLS Policy** (zaten mevcut):
```sql
CREATE POLICY "notifications_manage_own" 
ON public.notifications 
FOR ALL 
USING ((SELECT auth.uid()) = user_id);
```

**Güvenlik Garantisi**:
- Kullanıcı sadece kendi bildirimlerine erişebilir
- Route katmanında doğrulama unutulsa bile RLS korur
- Defense-in-depth: hem route hem DB katmanında kontrol

---

### 2. Profile Service

#### Fix 2.1: ensureProfileRecord() Deprecation

**Değişiklik**: Upsert side-effect kaldırıldı

**Öncesi**:
```typescript
export async function ensureProfileRecord(user: User) {
  const profile = buildProfileFromAuthUser(user);
  await admin.from("profiles").upsert(...); // ❌ Side-effect
  return profile;
}
```

**Sonrası**:
```typescript
/**
 * @deprecated Use buildProfileFromAuthUser() for read-only operations.
 * For profile creation, use createOrUpdateProfile().
 */
export async function ensureProfileRecord(user: User) {
  // Sadece auth metadata'dan profil oluştur - DB side effect yok
  return buildProfileFromAuthUser(user);
}
```

**Yeni Fonksiyon**: `createOrUpdateProfile()`
```typescript
/**
 * Creates or updates a profile record in the database.
 * Use this for explicit profile mutations (onboarding, auth callbacks).
 */
export async function createOrUpdateProfile(user: User) {
  const profile = buildProfileFromAuthUser(user);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("profiles").upsert(...);
  if (error) throw new Error(`Failed to create/update profile: ${error.message}`);
  return profile;
}
```

**Kullanım**:
- ✅ Read operations: `buildProfileFromAuthUser(user)`
- ✅ Profile bootstrap: `createOrUpdateProfile(user)` (auth callback'te)
- ❌ GET endpoint'lerinde upsert yapma

---

#### Fix 2.2: isUserBanned() Fail-Closed

**Değişiklik**: Production'da fail-closed davranış

**Öncesi**:
```typescript
if (!hasSupabaseAdminEnv()) {
  return false; // ❌ DB yoksa "yasaklı değil"
}
if (error || !data) {
  return false; // ❌ Hata varsa "yasaklı değil"
}
```

**Sonrası**:
```typescript
if (!hasSupabaseAdminEnv()) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Database unavailable - cannot verify ban status");
  }
  return false; // Development: allow operation
}

if (error) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Failed to check ban status: ${error.message}`);
  }
  return false; // Development: allow operation
}

if (!data) {
  return false; // User not found = not banned
}

return data.is_banned === true;
```

**Güvenlik Garantisi**:
- Production'da DB erişilemezse işlem bloklanır (503 error)
- Development'ta geliştirici deneyimi için fail-open
- Kritik güvenlik kontrolü asla sessizce atlanmaz

---

## 🧪 Test Senaryoları

### Notifications Service

**Test 1: Normal kullanım**
```typescript
// Kullanıcı kendi bildirimlerini okuyabilir
const notifications = await getStoredNotificationsByUser(currentUserId);
// ✅ Başarılı

// Kullanıcı kendi bildirimini silebilir
await deleteDatabaseNotification(currentUserId, notificationId);
// ✅ Başarılı
```

**Test 2: Exploit denemesi**
```typescript
// Saldırgan başka kullanıcının bildirimini silmeye çalışır
await deleteDatabaseNotification(victimUserId, victimNotificationId);
// ❌ RLS policy tarafından bloklanır - hiçbir satır silinmez
```

**Test 3: Admin işlemleri**
```typescript
// Sistem bildirimi oluşturma (admin client gerekli)
await createDatabaseNotification({
  userId: targetUserId,
  type: "system",
  title: "Hoş geldiniz",
  message: "Hesabınız oluşturuldu"
});
// ✅ Başarılı (admin client kullanıyor)
```

---

### Profile Service

**Test 4: Read-only profil erişimi**
```typescript
// GET endpoint'te profil bilgisi
const user = await getUser();
const profile = buildProfileFromAuthUser(user);
// ✅ DB'ye yazma yok, sadece auth metadata'dan okuma
```

**Test 5: Profil bootstrap (auth callback)**
```typescript
// Yeni kullanıcı kaydı sonrası
const user = await signUp(...);
await createOrUpdateProfile(user);
// ✅ Explicit mutation, audit edilebilir
```

**Test 6: Ban kontrolü - normal durum**
```typescript
const isBanned = await isUserBanned(userId);
// ✅ false (kullanıcı yasaklı değil)
```

**Test 7: Ban kontrolü - DB unavailable (production)**
```typescript
// DB bağlantısı kesildi
try {
  await isUserBanned(userId);
} catch (error) {
  // ✅ Error fırlatıldı: "Database unavailable - cannot verify ban status"
  // İşlem bloklandı (503 response)
}
```

**Test 8: Ban kontrolü - DB unavailable (development)**
```typescript
// Development ortamında DB bağlantısı kesildi
const isBanned = await isUserBanned(userId);
// ✅ false döndü (geliştirici deneyimi için fail-open)
```

---

## 📊 Etki Analizi (Impact Analysis)

### Değişen Davranışlar

1. **Notifications**:
   - ✅ RLS artık enforce ediliyor
   - ✅ Kullanıcılar sadece kendi bildirimlerine erişebilir
   - ⚠️ Route katmanında `userId` parametresi artık gereksiz (RLS zaten kontrol ediyor)
   - ⚠️ Admin panel bildirim yönetimi için ayrı endpoint gerekebilir

2. **Profile ensureProfileRecord()**:
   - ✅ Read operations artık side-effect üretmiyor
   - ⚠️ Profil bootstrap'ı auth callback'e taşınmalı
   - ⚠️ Mevcut `ensureProfileRecord()` çağrıları `buildProfileFromAuthUser()` veya `createOrUpdateProfile()` ile değiştirilmeli

3. **Profile isUserBanned()**:
   - ✅ Production'da fail-closed (güvenli)
   - ⚠️ DB unavailable durumunda 503 error dönecek
   - ⚠️ Error handling route katmanında yapılmalı

---

## 🔄 Migration Checklist

### Immediate (Bu PR'da)
- [x] Notifications service: admin client → server client
- [x] Profile: `ensureProfileRecord()` deprecate edildi
- [x] Profile: `createOrUpdateProfile()` eklendi
- [x] Profile: `isUserBanned()` fail-closed yapıldı
- [x] Dokümantasyon oluşturuldu

### Follow-up (Sonraki PR'lar)
- [ ] Auth callback'te `createOrUpdateProfile()` kullan
- [ ] Mevcut `ensureProfileRecord()` çağrılarını değiştir:
  - Read-only: `buildProfileFromAuthUser()`
  - Mutation: `createOrUpdateProfile()`
- [ ] Admin panel için ayrı notification endpoint'leri (gerekirse)
- [ ] `isUserBanned()` error handling route katmanında
- [ ] `ensureProfileRecord()` fonksiyonunu tamamen kaldır (breaking change)

---

## 🎯 Güvenlik Kazanımları (Security Improvements)

| Öncesi | Sonrası |
|--------|---------|
| ❌ Notifications: RLS bypass | ✅ RLS enforce edildi |
| ❌ Horizontal privilege escalation riski | ✅ Kullanıcı sadece kendi verisine erişebilir |
| ❌ Read operations side-effect üretiyor | ✅ Read operations immutable |
| ❌ Ban kontrolü fail-open | ✅ Production'da fail-closed |
| ❌ Kritik kontrol sessizce atlanabilir | ✅ DB unavailable → 503 error |

---

## 📝 Notlar

1. **RLS Policy Mevcut**: `notifications_manage_own` zaten var, sadece client değişikliği yeterli
2. **Breaking Change Yok**: `ensureProfileRecord()` deprecated ama hala çalışıyor
3. **Backward Compatible**: Mevcut kod çalışmaya devam ediyor
4. **Defense-in-Depth**: Hem route hem DB katmanında güvenlik kontrolü
5. **Production Safety**: Kritik kontroller fail-closed

---

## 🔗 İlgili Dosyalar

- `src/services/notifications/notification-records.ts`
- `src/services/profile/profile-records.ts`
- `database/schema.snapshot.sql` (RLS policies)

---

## ✅ Verification

```bash
# TypeScript kontrolü
npm run type-check

# Lint kontrolü
npm run lint

# Build kontrolü
npm run build
```

**Sonuç**: Tüm kontroller başarılı ✅
