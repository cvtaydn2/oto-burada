# Phase 3: İlan Öne Çıkarma & Doping Sistemi

## Genel Bakış

Phase 3, OtoBurada platformuna **doping (ilan öne çıkarma)** sistemini entegre eder. Kullanıcılar ödeme yaparak ilanlarını öne çıkarabilir, vitrin galerisinde gösterebilir veya acil etiketiyle işaretleyebilir.

## Tamamlanan Görevler

### 3.1 — Doping Paketleri Seed Data ✅

**Dosya:** `scripts/seed-doping-packages.mjs`

5 doping paketi tanımlandı:

| Paket | Fiyat | Süre | Tip | Özellikler |
|-------|-------|------|-----|------------|
| Ön Planda Göster | ₺49 | 7 gün | `featured` | Aramada üst sıralar, renkli arka plan |
| Acil İlan | ₺29 | 24 saat | `urgent` | "Acil" rozeti, özel sıralama |
| Renkli Çerçeve | ₺19 | 7 gün | `highlighted` | Turuncu çerçeve ile dikkat çeker |
| Galeri Highlight | ₺39 | 7 gün | `gallery` | Anasayfa carousel'de gösterim |
| Yenile (Bump) | ₺15 | Anında | `bump` | İlanı en üste taşır |

**Kullanım:**
```bash
node scripts/seed-doping-packages.mjs
```

### 3.2 — Doping Aktifleştirme Logic (Refaktör) ✅

#### Database Migration: `0069_doping_activation_functions.sql`

**Yeni RPC Fonksiyonları:**

1. **`activate_doping()`**: Ödeme doğrulaması sonrası doping'i aktif eder
   - Payment status kontrolü
   - Package validation
   - Listing ownership verification
   - Expiry calculation
   - Listing column updates (type-based)

2. **`get_active_dopings_for_listing()`**: İlan için aktif doping'leri listeler
   - Public read access
   - Expiry filtering

**pg_cron Job:**
- Her saat başı çalışır (`0 * * * *`)
- Süresi dolan doping'leri temizler:
  - `featured` → `false`
  - `is_urgent` → `false`
  - `highlighted_until` → `NULL`
  - `frame_color` → `NULL`
- `doping_purchases` tablosunda status → `expired`

**Performance Indexes:**
```sql
idx_listings_gallery_priority
idx_listings_featured_active
idx_listings_urgent_active
idx_doping_purchases_active
```

#### Cron Endpoint: `src/app/api/cron/expire-dopings/route.ts`

Application-level fallback ve audit trail:
- Vercel Cron ile saatlik tetikleme
- 4 ayrı expiry operation (featured, urgent, highlighted, purchases)
- Structured logging

#### Domain Logic: `src/domain/logic/doping-status-machine.ts`

State machine ve helper fonksiyonlar:
- `canTransitionDoping()`: State transition validation
- `isDopingActive()`: Active status check
- `getDopingRemainingTime()`: Human-readable expiry
- `getDopingListingUpdates()`: Optimistic UI updates
- `getDopingTypeLabel()`: Turkish labels

### 3.3 — Listing Doping Flag Güncelleme ✅

#### Service Layer: `src/services/payment/doping-service.ts`

RPC-based activation:
```typescript
static async applyDoping(params: {
  userId: string;
  listingId: string;
  packageId: string;
  paymentId: string;
})
```

- Slug → UUID mapping
- RPC call to `activate_doping`
- Error handling ve logging

#### API Route: `src/app/api/listings/[id]/doping/route.ts`

Secure doping activation endpoint:
- CSRF protection
- Listing ownership verification
- Payment validation
- Approved-only restriction

#### Type Updates

**`src/types/listing.ts`:**
```typescript
export interface ListingBadges {
  featured: boolean;
  featuredUntil?: string | null;
  urgentUntil?: string | null;
  highlightedUntil?: string | null;
  isFeatured?: boolean | null;
  isUrgent?: boolean | null;
  frameColor?: string | null;
  galleryPriority?: number | null;
}
```

**Query Updates:**
- `listingSelect`: Added `is_featured`, `is_urgent`, `frame_color`, `gallery_priority`
- `marketplaceListingSelect`: Same fields for optimized queries
- `ListingRow`: Type-safe mapping

### 3.4 — Homepage Galeri Carousel ✅

#### Component: `src/components/listings/featured-carousel.tsx`

**Features:**
- Embla Carousel integration
- Mobile-first responsive design
- Navigation buttons (desktop)
- Dot indicators (mobile)
- Auto-loop enabled
- Sparkles icon branding

**Props:**
```typescript
interface FeaturedCarouselProps {
  listings: Listing[];
  className?: string;
}
```

**Responsive Breakpoints:**
- Mobile: 85% width per slide
- Tablet: 45% width per slide
- Desktop: 30% width per slide
- XL: 23% width per slide

#### Homepage Integration: `src/app/(public)/(marketplace)/page.tsx`

**Listing Segmentation:**
```typescript
const featuredListings = listings.filter(l => l.featured).slice(0, 4);
const galleryListings = listings
  .filter(l => l.galleryPriority && l.galleryPriority > 0)
  .sort((a, b) => (b.galleryPriority ?? 0) - (a.galleryPriority ?? 0))
  .slice(0, 8);
const latestListings = listings
  .filter(l => !featuredIds.has(l.id) && !galleryIds.has(l.id))
  .slice(0, 8);
```

**Section Order:**
1. Hero + Quick Discovery
2. Featured Listings (grid)
3. **Gallery Carousel** (new)
4. Latest Listings (grid)
5. Trust Section

## Teknik Detaylar

### Database Schema Changes

**Listings Table:**
```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS frame_color text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS gallery_priority int DEFAULT 0;
```

**Doping Packages Table:**
```sql
CREATE TABLE doping_packages (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  duration_days integer NOT NULL,
  type text NOT NULL,
  features jsonb NOT NULL,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0
);
```

**Doping Purchases Table:**
```sql
CREATE TABLE doping_purchases (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  listing_id uuid REFERENCES listings(id),
  package_id uuid REFERENCES doping_packages(id),
  payment_id uuid REFERENCES payments(id),
  status text DEFAULT 'pending',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### Security & RLS

**Doping Packages:**
- Public read access
- Admin-only write

**Doping Purchases:**
- Owner read access
- Admin full access

**RPC Functions:**
- `SECURITY DEFINER` with `SET search_path = public`
- `GRANT EXECUTE` to authenticated users

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/listings/[id]/doping` | POST | Activate doping |
| `/api/cron/expire-dopings` | GET | Expire dopings (cron) |

### Constants

**`src/lib/constants/doping.ts`:**
```typescript
export const DOPING_PACKAGES: DopingPackage[] = [...]
export const getDopingPackageById = (id: string) => {...}
```

**`src/lib/constants/api-routes.ts`:**
```typescript
LISTINGS: {
  DOPING: (id: string) => `/api/listings/${id}/doping`,
  ...
}
```

## Deployment Checklist

### 1. Database Migration
```bash
npm run db:migrate
```

### 2. Seed Doping Packages
```bash
node scripts/seed-doping-packages.mjs
```

### 3. Verify pg_cron Job
```sql
SELECT * FROM cron.job WHERE jobname = 'expire-dopings-v2';
```

### 4. Environment Variables
Ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`

### 5. Vercel Cron Configuration
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-dopings",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Testing

### Manual Testing

1. **Doping Activation:**
   - Create a listing
   - Purchase a doping package
   - Verify listing flags update
   - Check expiry timestamp

2. **Gallery Carousel:**
   - Navigate to homepage
   - Verify carousel appears when gallery listings exist
   - Test navigation buttons (desktop)
   - Test swipe gestures (mobile)
   - Verify dot indicators

3. **Expiry:**
   - Wait for cron job execution
   - Verify expired dopings are cleared
   - Check `doping_purchases` status updates

### Automated Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build
```

## Known Issues

1. **Iyzipay Build Error**: Pre-existing dynamic import issue (not related to Phase 3)
   - Does not affect doping functionality
   - Tracked separately

## Future Enhancements

1. **Analytics Dashboard:**
   - Doping conversion rates
   - Revenue per package type
   - User engagement metrics

2. **A/B Testing:**
   - Carousel vs. grid layout
   - Package pricing optimization

3. **Advanced Features:**
   - Auto-renewal option
   - Bundle discounts
   - Seasonal promotions

## Documentation

- **AGENTS.md**: Updated with doping architecture
- **PROGRESS.md**: Phase 3 completion logged
- **TASKS.md**: Phase 3 tasks marked complete

## Sıradaki Adım

Phase 3 tamamlandı. Sistem production-ready durumda. Sıradaki adımlar:

1. Migration'ı production Supabase'e uygula
2. Doping paketlerini seed et
3. Vercel Cron'u yapılandır
4. Homepage'de gallery carousel'i test et
5. Kullanıcı feedback'i topla ve optimize et
