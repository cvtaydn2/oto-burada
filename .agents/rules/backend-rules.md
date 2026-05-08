---
trigger: always_on
---

# BACKEND & API CONSTITUTION (OtoBurada)

- **Öncelik**: Security > Maintainability > Reliability > Performance > Simplicity
- **Architecture**: Tüm backend `src/` altındadır. Route handler'lar ince olmalı, business logic barındırmamalıdır.
- **Service Layer**: `*-actions.ts` (Server Actions), `*-logic.ts` (Pure Business Logic), `*-records.ts` (Direct DB CRUD), `*-client.ts` (Third-party clients) modelini uygula. Class-based god servisler yasaktır.
- **Free-Tier Limits**: Supabase ve Vercel ücretsiz paketlerindeki bağlantı (connection pooling) ve çalışma süresi (timeout) limitlerini aşmamak için sorguları optimize et. Toplu işlemleri (N+1 sorgular) engelle. Resend günlük 100 e-posta ücretsiz sınırını aşmamak için gereksiz bildirim e-postaları gönderme.
- **Security**: Yetki kontrollerini (`withUserRoute`, `withAdminRoute`) her endpoint başında yap. Rate limit (Redis/Upstash) zorunludur.
- **Secrets**: Hassas verileri, key'leri veya database şifrelerini asla loglama veya client bundle'a sızdırma (`server-only` kullan).
- **Fail-Closed**: Payment/webhook akışlarında imza, sahiplik veya tutar doğrulanamazsa akışı anında kes (fail-closed).
- **No Network in Transactions**: DB transaction'ları içinde harici HTTP istekleri (Iyzico, Resend vb.) bekleme. Idempotent outbox/fulfillment kuyruğu kullan.
- **Validation**: Raw request body doğrudan işleme alınamaz, Zod şemasıyla doğrula. Stack trace'i kullanıcıya sızdırma.