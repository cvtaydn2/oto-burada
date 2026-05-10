# Runtime Errors Fix Notes

> Historical archive note: Bu belge artık aktif referans setinin parçası değildir. Runtime hata düzeltmelerinin tarihsel kaydı olarak korunur. Güncel durum için [`PROGRESS.md`](../../PROGRESS.md), operasyonel prosedürler için [`RUNBOOK.md`](../../RUNBOOK.md) ve teknik referanslar için [`docs/INDEX.md`](../INDEX.md) izlenmelidir.

## Çözülenler

0. Chat API validation status code iyileştirildi
- [`POST /api/chats/[id]/messages`](../../src/app/api/chats/[id]/messages/route.ts:28) artık `ZodError` için `500` yerine `400` döndürüyor.

1. Listing view CSRF 403 gürültüsü azaltıldı
- Güncel endpoint koruması: [`route.ts`](../../src/app/api/listings/view/route.ts:14)

2. Mesaj sayfası query-prefill bug giderildi
- Uygulama: [`MessagesPage`](../../src/app/dashboard/messages/page.tsx:62)

3. Chat API çağrılarında merkezi istemci kullanımı
- Uygulama: [`use-chat-queries.ts`](../../src/hooks/use-chat-queries.ts:1)

4. Chat endpoint validation status-code iyileştirmeleri
- [`POST /api/chats/[id]/messages`](../../src/app/api/chats/[id]/messages/route.ts:28): `ZodError` için `400`
- [`POST /api/chats/[id]/archive`](../../src/app/api/chats/[id]/archive/route.ts:6): body şeması + `ZodError` için `400`
- [`POST /api/chats`](../../src/app/api/chats/route.ts:32): UUID body şeması + `ZodError` için `400`

5. ChatWindow mutation hata yakalama sertleştirmesi
- [`handleSendMessage()`](../../src/components/chat/chat-window.tsx:90), [`handleArchive()`](../../src/components/chat/chat-window.tsx:70), [`handleDeleteMessage()`](../../src/components/chat/chat-window.tsx:76)
- Mutation hatalarında unhandled rejection yerine kullanıcıya `toast.error` gösterimi eklendi.

6. Request context tespiti güçlendirildi lib/supabase güvenilirliği
- [`isRequestContext()`](../../src/lib/next-context.ts:15) artık gerçek request-store erişimi `next/headers` ile doğrulama yapıyor.
- [`createSupabaseServerClient()`](../../src/lib/supabase/server.ts:7) içinde bu kontrol `await` edilerek yanlış-pozitif request context riski azaltıldı.

7. Services reconciliation worker context hardening
- [`processReconciliation()`](../../src/services/system/reconciliation-worker.ts:14) ve [`checkUserSubscriptionStatus()`](../../src/services/system/reconciliation-worker.ts:73) artık cron/sistem bağlamı için admin client kullanıyor.

8. Upload policy + chat sanitization hardening
- [`isMimeTypeAllowed()`](../../src/lib/storage/upload-policy.ts:26) içindeki `@ts-expect-error` kaldırıldı, MIME kontrolü normalize edilerek tip güvenli hale getirildi.
- [`CHAT_SECURITY_PATTERNS.URL`](../../src/lib/sanitization/chat-sanitization.ts:19) allowlist’i `otoburada.com.tr` alan adlarını kapsayacak şekilde genişletildi; false-positive maskeleme riski azaltıldı.

9. Script güvenlik sertleştirmesi demo reseed
- [`scripts/reseed-marketplace.mjs`](../../scripts/reseed-marketplace.mjs) içinde hardcoded demo şifre fallback’i kaldırıldı.
- Script artık [`SUPABASE_DEMO_USER_PASSWORD`](../../scripts/reseed-marketplace.mjs:11) olmadan çalışmıyor fail-fast.

10. Middleware log hijyeni lib/supabase
- [`updateSession()`](../../src/lib/supabase/middleware.ts:18) içindeki kullanıcı rolü debug `console.log` satırı kaldırıldı.
- Production log gürültüsü ve gereksiz user-id görünürlüğü azaltıldı.

11. Components katmanı düşük riskli UX/operasyon patchleri
- [`FavoritesPageClient`](../../src/components/listings/favorites-page-client.tsx:57) pull-to-refresh artık zorunlu tam sayfa yenilemesi yapmıyor; sadece query invalidation ile yeniliyor.
- [`BrandsManager`](../../src/components/admin/brands-manager.tsx:83) update/delete sonrası hard reload kaldırıldı; local state güncellemesiyle UI refresh sağlandı.
- [`BrandsManager`](../../src/components/admin/brands-manager.tsx:123) create sonrası `router.refresh()` eklendi hard reload yerine App Router uyumlu yenileme.
- [`PlansTable`](../../src/components/admin/plans-table.tsx:244) `PlanForm` başarı callback’inde hard reload kaldırıldı.

## Not

Bu doküman hızlı hatırlatma amaçlı tarihsel bir kayıttır. Ana referans:
- [`PROGRESS.md`](../../PROGRESS.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/INDEX.md`](../INDEX.md)
