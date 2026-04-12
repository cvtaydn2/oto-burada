# Oto Burada UI/UX İyileştirme Planı

## 🚨 Kritik Sorunlar (Acil)

### 1. Dashboard Encoding Hatası
- **Dosya:** `src/app/dashboard/page.tsx`
- **Sorun:** Karakterler UTF-8 yerine Latin-1 olarak kodlanmış görünüyor ("hoÅŸ geldin" yerine "Hoş geldin")
- **Çözüm:** Metinleri düzgün Unicode olarak yeniden yaz

### 2. Mobil Filtre Eksikliği
- **Dosya:** `src/components/modules/listings/smart-filters.tsx`
- **Sorun:** Filtreler mobilde kullanılamıyor, drawer/modal yok
- **Çözüm:** MobileFilterDrawer bileşeni oluştur

### 3. Konum Filtreleme Yetersiz
- **Dosya:** `src/components/modules/listings/smart-filters.tsx`
- **Sorun:** İl-İlçe bağımlılığı işlenmemiş
- **Çözüm:** Cascading Select yapısı kur

### 4. Sayfalama Yok
- **Dosya:** `src/components/listings/listings-page-client.tsx`
- **Sorun:** Infinite scroll veya pagination eksik
- **Çözüm:** Pagination ekle

### 5. Sıralama Çalışmıyor
- **Dosya:** `src/components/listings/listings-page-client.tsx`
- **Sorun:** Sort düğmesi işlevsiz
- **Çözüm:** Sort işlevselliğini tamamla

### 6. Marka Logoları Eksik
- **Dosya:** `src/components/layout/home-hero.tsx`
- **Sorun:** Sadece metin, logo yok
- **Çözüm:** SVG marka logoları ekle

---

## 📋 Orta Vadeli İyileştirmeler

### Teknik Özellikler
- Renk, motor gücü, tork, çekiş sistemi, yakıt tüketimi

### Galeri Geliştirmeleri
- Video desteği
- 360° görseller
- Zoom özelliği

### Satıcı Profilleri
- Gerçek profil fotoğrafları
- Tam istatistikler
- Değerlendirmeler

### Araç Karşılaştırma
- Multi-select karşılaştırma

---

## 🎯 Öncelik Sıralaması

### Sprint 1 (0-2 Hafta) - Acil
1. Dashboard encoding düzelt
2. Mobil filtre drawer ekle
3. Konum filtreme altyapı
4. Sayfalama ekle

### Sprint 2 (2-4 Hafta) - Öncelikli
1. Sıralama düzelt
2. Marka logoları ekle
3. Car card özellikleri genişlet
4. Boş/hata durumları ekle

### Sprint 3 (1-2 Ay) - Geliştirme
1. Video/360° galeri
2. Karşılaştırma özelliği
3. Print/PDF export
4. Paylaşım özellikleri

---

## 📁 Gerekli Yeni Dosyalar

```
src/
├── components/
│   └── ui/
│       └── filter-drawer.tsx      # Yeni: Mobil filtre drawer
│       ├── pagination.tsx         # Yeni: Sayfalama bileşeni
│       └── infinite-scroll.tsx    # Yeni: Sonsuz kaydırma
├── hooks/
│   └── use-location-filter.ts    # Yeni: Konum filtresi hook
└── types/
    └── filter.ts                # Yeni: Filtre tipleri
```

---

## 🏗️ Clean Code Prensipleri

### 1. Single Responsibility
Her bileşen tek bir iş yapar:
- `SmartFilters` → Sadece filtre UI
- `CarCard` → Sadece kart görüntüleme
- `FilterDrawer` → Sadece mobil filtre paneli

### 2. DRY (Don't Repeat Yourself)
Tekrarlanan kodlar hook'lara taşınır:
- `useLocationFilter` → İl-İlçe mantığı
- `usePagination` → Sayfalama mantığı
- `useInfiniteScroll` → Scroll mantığı

### 3. Props Interface
Tüm bileşenler için tipli prop'lar:
```typescript
interface CarCardProps {
  listing: Listing;
  variant?: 'grid' | 'list';
  onFavorite?: (id: string) => void;
}
```

### 4. Component Composition
Bileşenler birbirini extends etmez, composition kullanır:
```typescript
// ✅ Doğru
function ListingsPage({ children }) {
  return (
    <FilterProvider>
      <SortProvider>
        {children}
      </SortProvider>
    </FilterProvider>
  )
}

// ❌ Yanlış
class ListingsPage extends BasePage { }
```

### 5. Error Boundaries
Tüm veri çeken bileşenlerde error/loading handling:
```typescript
function ListingsGrid({ isLoading, error, data }) {
  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data.length) return <EmptyState />
  return <Grid items={data} />
}
```

---

## 🎨 Design System Kuralları

### Renk Kullanımı
```typescript
// colors.ts
export const colors = {
  primary: '#2563eb',      // Ana renk (mavi)
  success: '#22c55e',     // Başarı/Onay
  warning: '#f59e0b',     // Uyarı
  danger: '#ef4444',      // Hata/Sil
  featured: '#f97316',    // Öne çıkan
  urgent: '#dc2626',      // Acil
}
```

### Tipografi
```typescript
// typography.ts
export const typography = {
  h1: 'text-4xl font-black tracking-tight',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  body: 'text-base font-normal',
  caption: 'text-sm text-muted-foreground',
}
```

### Boşluk Ölçeği
```typescript
// spacing.ts
export const spacing = {
  xs: 'gap-1',    // 4px
  sm: 'gap-2',    // 8px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
  xl: 'gap-8',    // 32px
}
```

---

## ✅ Doğrulama Listesi

- [ ] TypeScript error yok
- [ ] ESLint warning < 10
- [ ] Tüm testler geçiyor
- [ ] Mobilde çalışıyor (375px)
- [ ] Tabletde çalışıyor (768px)
- [ ] Desktopta çalışıyor (1440px)
- [ ] Erişilebilirlik kontrolleri geçiyor
- [ ] Performans kabul edilebilir (>80 Lighthouse)