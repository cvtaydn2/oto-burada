# Production Troubleshooting

## 1) Listing view 403

Belirti:
- Konsolda `listing_view_csrf_rejected`

Kontrol:
- Endpoint koruması: [`POST()`](../src/app/api/listings/view/route.ts:14)
- CSRF/origin kontrolü: [`withSecurity()`](../src/lib/api/security.ts:51)

Beklenen:
- Public listing view endpoint’inde token zorunluluğu yerine origin kontrolü uygulanır.

## 2) Mesaj Gönder tıklanınca konuşma açılmıyor

Kontrol:
- Redirect: [`ContactActions`](../src/components/listings/contact-actions.tsx:233)
- Prefill create chat: [`MessagesPage` effect](../src/app/dashboard/messages/page.tsx:62)

Beklenen:
- `?new=<listingId>&seller=<sellerId>` parametresi varsa chat oluşturulur ve seçilir.

## 3) CSRF kaynaklı dağınık istemci hataları

Kontrol:
- Merkezi API client kullanımı: [`ApiClient.request()`](../src/lib/api/client.ts:20)
- Chat hook’ları: [`use-chat-queries.ts`](../src/hooks/use-chat-queries.ts:1)

Beklenen:
- Mutation/read çağrıları mümkün olduğunca merkezi client üzerinden çalışır.
