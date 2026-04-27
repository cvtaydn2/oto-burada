# OtoBurada

Sadece arabalar için tasarlanmış, mobil öncelikli ve güven odaklı ücretsiz ilan pazaryeri.

## 🎯 Misyon

"Arabanı kolayca sat. Doğru arabayı hızlıca bul."
Gereksiz karmaşıklıktan arındırılmış, sadece otomobil alım-satımına odaklanan, WhatsApp üzerinden hızlı iletişim sağlayan en yalın pazar yeri deneyimi.

## 🚀 Temel Özellikler

- **Hızlı İlan:** 2 dakikanın altında ilan oluşturma akışı.
- **Akıllı Filtreleme:** Aradığın araca 3 etkileşimde ulaşma hedefi.
- **Güven Odağı:** Admin moderasyonu ve şüpheli ilan raporlama.
- **WhatsApp Entegrasyonu:** Alıcı ve satıcıyı doğrudan WhatsApp üzerinden buluşturma.
- **Gelişmiş Dashboard:** İlan yönetimi, favoriler ve kayıtlı aramalar.
- **Admin Paneli:** Moderasyon, analizler ve operasyonel yönetim.

## 🛠️ Teknoloji Yığını

- **Core:** Next.js 15+ (App Router), TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, Postgres, Storage, RLS)
- **Data:** TanStack Query, Zod, React Hook Form
- **Analytics:** PostHog, Vercel Analytics

## ⚙️ Kurulum

### 1. Hazırlık

`.env.example` dosyasını referans alarak `.env.local` oluşturun ve gerekli Supabase anahtarlarını girin.

### 2. Bağımlılıklar ve Geliştirme

```bash
npm install
npm run dev
```

### 3. Veritabanı Kurulumu (Supabase)

```bash
# Temiz şemayı uygular
npm run db:apply-schema

# Mevcut yamaları (migration) geçer
npm run db:migrate

# Örnek verileri (seed) yükler
npm run db:seed-demo
```

## 📐 Proje Yapısı

- `src/app`: Sayfa ve rota tanımları (Marketplace, Dashboard, Admin).
- `src/components`: UI bileşenleri ve özellik bazlı modüller.
- `src/domain`: İş mantığı orkestrasyonu (Use Cases).
- `src/lib`: Supabase istemcileri, yardımcı fonksiyonlar ve validatorlar.
- `src/services`: Veri erişim, persistence ve dış servis entegrasyonları.
- `database/`: SQL şemaları ve migration dosyaları.

## 🏗️ Mimari

OtoBurada, **Server Actions** pattern'ini kullanarak modern, tip-güvenli ve performanslı bir mimari benimser.

### Servis Katmanı

- **Server Actions** (`*-actions.ts`): API endpoints ve authentication
- **Data Access** (`*-records.ts`): Database queries ve RLS-compliant operations
- **Business Logic** (`*-logic.ts`): Pure functions ve domain rules
- **External Clients** (`*-client.ts`): Third-party API integrations (Iyzico, OpenAI, etc.)

### Detaylı Dokümantasyon

- **[AGENTS.md](./AGENTS.md)**: Mimari standartlar ve kurallar
- **[docs/SERVICE_ARCHITECTURE.md](./docs/SERVICE_ARCHITECTURE.md)**: Servis mimarisi migration guide
- **[docs/SECURITY.md](./docs/SECURITY.md)**: Güvenlik politikaları

### Temel Prensipler

1. **Server-First**: Server components ve server actions öncelikli
2. **Type Safety**: TypeScript strict mode ve Zod validation
3. **RLS Compliance**: Tüm database işlemleri Row Level Security ile korunur
4. **Functional Approach**: Class-based patterns yerine functional programming
5. **Separation of Concerns**: Data, logic ve presentation katmanları ayrı

## 📖 Dokümantasyon Modeli

- **AGENTS.md**: Ürün vizyonu, mimari kurallar ve temel yasalar (Source of Truth).
- **TASKS.md**: Yol haritası ve yapılacak işler listesi.
- **PROGRESS.md**: Uygulama geçmişi ve güncel durum kayıtları.

---

_Geliştirmeye başlamadan önce lütfen `AGENTS.md` dosyasındaki kuralları okuyun._
