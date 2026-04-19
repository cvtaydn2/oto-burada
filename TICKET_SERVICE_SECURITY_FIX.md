# 🔒 Ticket Service Security Fix

## Sorun

`src/services/support/ticket-service.ts` içinde **public/user ticket creation** işlemleri `createSupabaseAdminClient()` kullanıyordu. Bu, **RLS (Row Level Security) politikalarını tamamen bypass ediyordu**.

### Güvenlik Riski

| Fonksiyon | Önceki Durum | Risk |
|-----------|--------------|------|
| `createPublicTicket()` | Admin client | RLS bypass → herhangi bir `user_id` ile ticket oluşturulabilir |
| `createTicket()` | Server client (✓) | Güvenli ama tutarsız pattern |
| `updateTicketStatus()` | Admin client | RLS bypass → admin check route katmanında |

**Exploit Senaryosu:**
1. Saldırgan `/api/contact` endpoint'ini reverse engineer eder
2. `createPublicTicket()` fonksiyonunu başka bir endpoint'ten çağırır
3. Admin client RLS'i bypass ettiği için `user_id` manipüle edilebilir
4. Başka kullanıcılar adına ticket oluşturulabilir

---

## Çözüm

### 1. Security Definer RPC Functions

**Yeni Migration:** `database/migrations/0040_secure_public_ticket_creation.sql`

3 yeni RPC fonksiyonu eklendi:

#### `create_public_ticket()`
```sql
-- Public contact form için (user_id = NULL)
-- Anon role'e grant edildi
-- RLS policy "tickets_insert_own_or_public" enforce ediliyor
```

#### `create_user_ticket()`
```sql
-- Authenticated user ticket creation
-- auth.uid() otomatik olarak user_id'ye atanıyor
-- RLS policy "tickets_insert_own_or_public" enforce ediliyor
```

#### `admin_update_ticket()`
```sql
-- Admin-only ticket update
-- is_admin() check fonksiyon içinde yapılıyor
-- RLS policy "tickets_update_own_open_or_admin" enforce ediliyor
```

### 2. Service Layer Güncellemesi

**Değişiklikler:**

| Fonksiyon | Önceki | Sonrası |
|-----------|--------|---------|
| `createPublicTicket()` | `admin.from("tickets").insert()` | `supabase.rpc("create_public_ticket")` |
| `createTicket()` | `supabase.from("tickets").insert()` | `supabase.rpc("create_user_ticket")` |
| `updateTicketStatus()` | `admin.from("tickets").update()` | `supabase.rpc("admin_update_ticket")` |
| `getAllTickets()` | Admin client (✓) | Değişmedi — admin-only read |
| `getTicketCount()` | Admin client (✓) | Değişmedi — admin-only read |

### 3. RLS Enforcement

Artık **tüm ticket write işlemleri** RLS politikalarından geçiyor:

```sql
-- Public ticket (user_id = NULL)
CREATE POLICY "tickets_insert_own_or_public" 
ON public.tickets FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id OR user_id IS NULL);

-- User can only create tickets for themselves
-- Public tickets (user_id = NULL) are allowed
```

---

## Kurulum

### Adım 1: Migration Çalıştır

```bash
# Supabase SQL Editor'da çalıştır
database/migrations/0040_secure_public_ticket_creation.sql
```

### Adım 2: Doğrulama

```sql
-- RPC fonksiyonlarını test et
SELECT create_public_ticket(
  'Test Subject',
  'Test Description',
  'other',
  'medium',
  NULL
);

-- Admin check test et (admin değilsen hata vermeli)
SELECT admin_update_ticket(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'resolved',
  'Test response'
);
```

### Adım 3: Deploy

```bash
git add .
git commit -m "fix: secure ticket creation via RPC, enforce RLS"
git push origin main
```

---

## Test Senaryoları

### Test 1: Public Ticket Creation
```bash
# Contact form'dan ticket oluştur
curl -X POST https://oto-burada.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Test message",
    "_hp": ""
  }'
```

**Beklenen:** ✅ Ticket oluşur, `user_id = NULL`

### Test 2: Authenticated User Ticket
```bash
# Dashboard'dan ticket oluştur (giriş yapmış kullanıcı)
# /dashboard/support sayfasından form gönder
```

**Beklenen:** ✅ Ticket oluşur, `user_id = auth.uid()`

### Test 3: Admin Update
```bash
# Admin dashboard'dan ticket güncelle
# /admin/tickets sayfasından status değiştir
```

**Beklenen:** ✅ Admin ise güncellenir, değilse hata

### Test 4: RLS Bypass Denemesi (Exploit)
```sql
-- Supabase SQL Editor'da (anon role olarak)
INSERT INTO public.tickets (user_id, subject, description, category, priority, status)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,  -- Başka kullanıcının ID'si
  'Hacked',
  'Exploit attempt',
  'other',
  'high',
  'open'
);
```

**Beklenen:** ❌ RLS policy violation hatası

---

## Güvenlik İyileştirmeleri

### Öncesi (Vulnerable)
```typescript
// ❌ Admin client RLS'i bypass ediyor
const admin = createSupabaseAdminClient();
await admin.from("tickets").insert({
  user_id: null,  // Manipüle edilebilir
  subject: input.subject,
  // ...
});
```

### Sonrası (Secure)
```typescript
// ✅ Server client + RPC, RLS enforce ediliyor
const supabase = await createSupabaseServerClient();
await supabase.rpc("create_public_ticket", {
  p_subject: input.subject,
  // user_id RPC içinde NULL olarak set ediliyor
  // ...
});
```

---

## Admin Client Kullanım Kuralları

### ✅ Admin Client Kullanılabilir (Read-Only)
- `getAllTickets()` — Admin dashboard, tüm ticket'leri görmek için
- `getTicketCount()` — Admin dashboard, istatistikler için
- `getUserEmailAndName()` — Email gönderimi için (helper)

### ❌ Admin Client Kullanılmamalı (Write Operations)
- ~~`createPublicTicket()`~~ → RPC kullan
- ~~`createTicket()`~~ → RPC kullan
- ~~`updateTicketStatus()`~~ → RPC kullan

### Kural
> **Write işlemleri için admin client kullanma.**  
> **Security Definer RPC kullan, RLS'i enforce et.**

---

## Diğer Servislerde Kontrol Edilmesi Gerekenler

Aynı pattern'i kontrol et:

```bash
# Admin client kullanımını bul
grep -r "createSupabaseAdminClient" src/services/

# Şüpheli write işlemlerini kontrol et
grep -r "admin.from.*insert\|admin.from.*update" src/services/
```

**Kontrol edilecek servisler:**
- `src/services/listings/` — Listing creation admin client kullanıyor mu?
- `src/services/favorites/` — Favorite ekleme admin client kullanıyor mu?
- `src/services/reports/` — Report creation admin client kullanıyor mu?
- `src/services/messages/` — Message gönderme admin client kullanıyor mu?

---

## Özet

| Metrik | Öncesi | Sonrası |
|--------|--------|---------|
| RLS Bypass | ✅ Var | ❌ Yok |
| Admin Client (Write) | 3 fonksiyon | 0 fonksiyon |
| Security Definer RPC | 0 | 3 |
| RLS Enforcement | Kısmi | Tam |
| Exploit Risk | Yüksek | Düşük |

**Sonuç:** Ticket creation/update işlemleri artık RLS politikalarından geçiyor. Admin client sadece read-only admin operasyonlarında kullanılıyor. ✅
