# PROGRESS.md

Bu dosya tekrar iş yapmamak ve mevcut durumu hızlı görmek için tutulur.
Her yeni geliştirme başlamadan önce okunmalıdır.

---

## Çalışma Kuralı
- Her geliştirme başlangıcında `PROGRESS.md` incelenir.
- Geliştirme sadece `TASKS.md` sırasına göre ilerler.
- Tamamlanan her görev sonunda bu dosya güncellenir.

---

## Proje Durumu
- Güncel faz: `Data & Feature Expansion`
- Güncel görev: `Tamamlandı - Car Catalog, Locations, Expert Inspection`
- Durum: completed

---

## Son Doğrulama Sonuçları
- `npm run lint` - Geçti (0 error)
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 24/24 geçti

---

## 2026-04-08 Uyumluluk ve Semantik Audit

### Kapsam
- Genel dökümanlar tekrar okundu: `AGENTS.md`, `BRAND_SYSTEM.md`, `CONTENT_COPY.md`, `TASKS.md`, `README.md`
- Kod tabanı frontend + backend + test + script katmanlarında semantik olarak tarandı
- Supabase env ve MCP yapılandırması kontrol edildi

### Yapılan Düzeltmeler
- `package.json` içinde `typecheck` akışı `next typegen && tsc --noEmit` olacak şekilde düzeltildi; böylece `.next` tipleri hazır olmadan yalancı kırılım oluşmuyor
- `src/components/listings/listings-page-client.tsx` içinde React lint kıran effect tabanlı state senkronizasyonu kaldırıldı; filtre URL eşitlemesi artık event akışında kararlı çalışıyor
- `playwright.config.ts` içindeki web server akışı `build + start` modeline alındı; testler Turbopack dev server bağımlılığından çıkarıldı
- Eski response formatını bekleyen `tests/e2e.spec.ts` favori testi, mevcut standart API zarfına (`success/data`) hizalandı
- Kullanılmayan import/değişken ve küçük a11y/lint sorunları temizlendi
- `scripts/create-users.mjs` içinde eksik `NEXT_PUBLIC_SUPABASE_ANON_KEY` okuması eklendi; scriptteki bariz çalışma hatası giderildi

### Doğrulama
- `npm run lint` - Geçti
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 24/24 geçti
- `npm run db:check-env` - Geçti
  - Eksik tek bootstrap değişkeni: `SUPABASE_DEMO_USER_PASSWORD`

### Supabase MCP Notu
- `C:\Users\Cevat\.codex\config.toml` içinde Supabase MCP girdisi yanlış formatta görünüyor
- Mevcut kayıt:
  - `[mcp_servers.supabase]`
  - `command = "codex mcp add supabase --url https://mcp.supabase.com/mcp?project_ref=yagcxhrhtfhwaxzhyrkj"`
- Sorun:
  - Bu alan aktif MCP sunucu adresi yerine kurulum komutunu saklıyor
  - Ayrıca ekranda önerilen `[mcp] remote_mcp_client_enabled = true` satırı config içinde görünmüyor
  - Aktif oturumda MCP resource/template listesi boş döndü; bu da bağlantının fiilen devreye girmediğini destekliyor

### Kararlar
- `TASKS.md` sırasını bozacak yeni feature geliştirmesi yapılmadı; odak doğrulama ve uyumluluk düzeltmeleri oldu
- Mevcut kullanıcı değişiklikleri korunarak ilerlenildi, unrelated dosyalar geri alınmadı

### Sonraki Adım
- Supabase MCP config girişini gerçek `url = "..."`
  formatına çevirip remote MCP client desteğini etkinleştir
- İstersen ikinci adımda `npm run dev` akışını da ayrıca audit edip kökteki `nul` artefact’ının Turbopack üzerindeki etkisini temizleyelim
