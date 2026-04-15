# Ortam Yönetimi (Environment Management)

OtoBurada projesi, Vercel'in standard **Local**, **Preview** ve **Production** ortamlarını kullanır.

## Ortamlar

1. **Local Development**: Yerel makinenizde geliştirme yaptığınız ortam. `.env.local` dosyasını kullanır.
2. **Preview**: Her Git branch'i için otomatik oluşturulan test ortamı. Canlı veritabanına zarar vermeden QA yapmak için kullanılır.
3. **Production**: Kullanıcıların eriştiği asıl canlı ortam (`main` branch).

## Kurulum ve Senkronizasyon

Vercel üzerindeki ortam değişkenlerini (API anahtarları vb.) yerel makinenize çekmek için:

1. **Vercel CLI Kurulumu** (Eğer yüklü değilse):
   ```bash
   npm i -g vercel
   ```

2. **Proje Linkleme**:
   ```bash
   npm run vercel:link
   ```

3. **Değişkenleri Çekme**:
   ```bash
   npm run vercel:pull
   ```
   Bu komut yerel dizininizde güncel bir `.env.local` oluşturur.

## Supabase Storage Bucket Ayrımı

- `SUPABASE_STORAGE_BUCKET_LISTINGS`: herkese açık listing görselleri için kullanılır.
- `SUPABASE_STORAGE_BUCKET_DOCUMENTS`: ekspertiz ve benzeri hassas belgeler için private bucket olmalıdır.

Belge bucket'ı için public read açılmamalı; uygulama bu dosyaları kısa ömürlü signed URL ile sunar.

## Dağıtım (Deployment)

Uygulamayı Vercel'e manuel olarak göndermek için:

- **Preview Deployment**:
  ```bash
  npm run deploy:preview
  ```

- **Production Deployment**:
  ```bash
  npm run deploy:prod
  ```

## Dinamik URL Yönetimi

Uygulama içinde ortama duyarlı URL'ler (örn: Auth yönlendirmeleri) için `src/lib/utils/app-env.ts` yardımcı aracı kullanılmalıdır:

```typescript
import { getBaseUrl, getAppEnvironment } from "@/lib/utils/app-env";

const baseUrl = getBaseUrl(); // Yerelde localhost, Vercel'de dinamik URL döner.
```
