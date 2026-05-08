---
trigger: always_on
---

# DATABASE RULES (OtoBurada)

- **Source of Truth**: `database/schema.snapshot.sql` şemanın kaynağıdır. Yeni değişiklikler `database/migrations/00XX_name.sql` içinde olmalı ve `npm run db:migrate` ile çalıştırılmalıdır.
- **Supabase Storage & DB Quota**: Supabase ücretsiz 500MB veritabanı ve 1GB depolama (Storage) sınırlarını aşmamak için:
  - Görseller yüklenmeden önce istemcide veya Edge Function'da WebP olarak sıkıştırılmalı ve boyutlandırılmalıdır.
  - Gereksiz loglama tabloları yerine geçici veriler için akıllı silme/cleanup politikaları izle.
- **RLS First**: Her yeni tablo için aynı migration dosyasında RLS aktif edilmeli ve least-privilege policy'ler yazılmalıdır. Policy içinde `(SELECT auth.uid())` tercih et.
- **Security Definer**: DB fonksiyonlarında `SET search_path = public` zorunludur.
- **Performance**: Foreign key'ler, join hot-path'leri ve filtre/sıralama kolonları indexlenmelidir. CPU/RAM limitlerini zorlamamak için `SELECT *` hot path'lerde yasaktır.
- **Integrity**: Banned/deleted kullanıcıların ilanları inner join'ler ile DB düzeyinde filtrelenmeli, listelerde sızmamalıdır.