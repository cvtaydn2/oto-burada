# Security Guide

Bu doküman, uygulamadaki güvenlik katmanlarının kısa operasyonel özetidir.

## 1) API Güvenlik Katmanları

- Global origin kontrolü: [`checkApiSecurity()`](../src/lib/middleware/api-security.ts:16)
- Global CSRF middleware wrapper: [`csrfMiddleware()`](../src/lib/middleware/csrf.ts:12)
- Route-level güvenlik orkestrasyonu: [`withSecurity()`](../src/lib/api/security.ts:51)

## 2) CSRF Stratejisi

- Hash-cookie + header token modeli: [`validateCsrfToken()`](../src/lib/security/csrf.ts:98)
- Token üretimi/rotasyonu: [`setCsrfTokenCookie()`](../src/lib/security/csrf.ts:161), [`rotateCsrfToken()`](../src/lib/security/csrf.ts:183)
- Public ama mutation endpoint’lerde minimum koruma: `requireCsrf: true` (origin check)

## 3) Auth ve Yetki

- Session + profil bağlamı: [`getAuthContext()`](../src/lib/auth/session.ts:1)
- Admin kontrolü: [`withAdminRoute()`](../src/lib/api/security.ts:279)
- Ban kontrolü (DB bazlı): [`withSecurity()`](../src/lib/api/security.ts:159)

## 4) Hızlı İnceleme Checklist

1. Mutation endpoint’te wrapper var mı?
2. Public endpoint ise en az origin kontrolü var mı?
3. Client tarafında `service_role` key sızıntısı var mı?
4. Hata mesajları güvenli ve kullanıcı dostu mu?
5. Rate-limit profili uygun mu?
