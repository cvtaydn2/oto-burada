---
trigger: always_on
---

# SECURITY RULES (OtoBurada)

- **Priority**: Güvenlik ve veri bütünlüğü her şeyden önce gelir.
- **Auth & Authz**: Supabase Auth canonical sistemdir. Mutation'larda sahiplik, rol ve yasaklılık durumu mutlaka DB'den anlık sorgulanmalıdır.
- **CSRF & Rate Limit**: Authenticated mutation'larda CSRF koruması sağla. Upstash Redis free-tier istek sınırlarını korumak için rate-limit değerlerini optimum belirle.
- **Sensitive Data**: Parola, JWT, API key ve token'ları asla loglama veya istemciye gönderme.
- **Upload Safety**: Görsel yüklemelerinde MIME type, dosya boyutu kontrolü yap ve path üretimini güvenli (WebP formatı ve rastgele/UUID) hale getir. Supabase Storage sınırlarına sadık kal.
- **HTML Safety**: User-generated content render edilirken XSS'e karşı sanitize et. `dangerouslySetInnerHTML` kullanımından kaçın.
