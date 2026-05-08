# API Route Audit

Total routes: 67

| Route | Methods | Security Wrapper | Admin Client | Server Client | Direct .from() |
|---|---|---|---|---|---|
| src/app/api/admin/broadcast/route.ts | POST | withAdminRoute | yes | no | yes |
| src/app/api/admin/cache/clear/route.ts | POST | withAdminRoute | no | no | no |
| src/app/api/admin/listings/[id]/edit/route.ts | PATCH | withAdminRoute | yes | no | yes |
| src/app/api/admin/listings/[id]/moderate/route.ts | POST | withAdminRoute | no | no | no |
| src/app/api/admin/listings/bulk-moderate/route.ts | POST | withAdminRoute | no | no | no |
| src/app/api/admin/market/sync/route.ts | GET, POST | withCronOrAdmin | yes | no | yes |
| src/app/api/admin/reports/[reportId]/route.ts | PATCH | withAdminRoute | no | no | no |
| src/app/api/admin/security/ban/route.ts | POST | withAdminRoute | yes | no | yes |
| src/app/api/admin/tickets/[id]/route.ts | PATCH | withAdminRoute | no | no | no |
| src/app/api/admin/users/export/route.ts | GET | withAdminRoute | yes | no | yes |
| src/app/api/auth/csrf/route.ts | GET | none | no | no | no |
| src/app/api/auth/sign-out/route.ts | POST | withUserAndCsrf | no | yes | no |
| src/app/api/chats/[id]/archive/route.ts | POST | withUserAndCsrf | no | no | no |
| src/app/api/chats/[id]/messages/route.ts | GET, POST, DELETE | withUserRoute, withUserAndCsrf | no | no | no |
| src/app/api/chats/[id]/read/route.ts | PATCH, POST | withUserAndCsrfToken | no | no | no |
| src/app/api/chats/route.ts | GET, POST | withUserRoute, withUserAndCsrf | no | no | no |
| src/app/api/contact/route.ts | POST | none | yes | no | no |
| src/app/api/cron/cleanup-stale-payments/route.ts | GET | withCronOrAdmin | yes | no | yes |
| src/app/api/cron/cleanup-storage/route.ts | GET | withCronOrAdmin | yes | no | yes |
| src/app/api/cron/expire-dopings/route.ts | GET | withCronOrAdmin | yes | no | no |
| src/app/api/cron/expire-listings/route.ts | GET | withCronOrAdmin | yes | no | yes |
| src/app/api/cron/expire-reservations/route.ts | POST | withCronOrAdmin | no | no | no |
| src/app/api/cron/main/route.ts | GET | withCronOrAdmin | yes | no | yes |
| src/app/api/cron/outbox/route.ts | GET | withCronOrAdmin | no | no | no |
| src/app/api/cron/process-fulfillment-jobs/route.ts | GET | withCronOrAdmin | yes | no | yes |
| src/app/api/cron/sync-listing-views/route.ts | GET | withCronOrAdmin | yes | no | no |
| src/app/api/favorites/[listingId]/route.ts | DELETE | withAuthAndCsrf | no | no | no |
| src/app/api/favorites/route.ts | GET, POST | withUserAndCsrfToken | no | no | no |
| src/app/api/health-check/route.ts | GET | none | yes | yes | yes |
| src/app/api/health/route.ts | GET | withSecurity | yes | no | yes |
| src/app/api/listings/[id]/archive/route.ts | POST | withUserAndCsrf | no | yes | yes |
| src/app/api/listings/[id]/bump/route.ts | POST | withUserAndCsrf | no | yes | yes |
| src/app/api/listings/[id]/doping/route.ts | POST | withUserAndCsrf | no | yes | yes |
| src/app/api/listings/[id]/price-history/route.ts | GET | none | no | no | no |
| src/app/api/listings/[id]/route.ts | PATCH, DELETE | withUserAndCsrf | no | no | no |
| src/app/api/listings/[id]/verify-eids/route.ts | POST | none | no | no | no |
| src/app/api/listings/bulk-archive/route.ts | POST | withAuthAndCsrf | no | no | no |
| src/app/api/listings/bulk-delete/route.ts | POST | withAuthAndCsrf | no | no | no |
| src/app/api/listings/bulk-draft/route.ts | POST | withAuthAndCsrf | no | yes | yes |
| src/app/api/listings/expiry-warnings/route.ts | GET, POST | none | yes | no | yes |
| src/app/api/listings/images/cleanup/route.ts | POST | withUserAndCsrfToken | yes | no | no |
| src/app/api/listings/images/route.ts | POST, DELETE | withAuthAndCsrf | no | yes | no |
| src/app/api/listings/mine/route.ts | GET | withSecurity | no | no | no |
| src/app/api/listings/route.ts | GET, POST | withUserAndCsrfToken | no | no | no |
| src/app/api/listings/view/route.ts | POST | withCsrfToken | no | no | no |
| src/app/api/market/estimate/route.ts | GET | none | no | no | no |
| src/app/api/notifications/[notificationId]/route.ts | PATCH, DELETE | withAuthAndCsrf | no | no | no |
| src/app/api/notifications/preferences/route.ts | GET, PATCH | withUserRoute, withUserAndCsrf | no | no | no |
| src/app/api/notifications/publish/route.ts | POST | withAdminRoute | no | no | no |
| src/app/api/notifications/route.ts | GET, PATCH | withAuth, withAuthAndCsrf | no | no | no |
| src/app/api/offers/accept/route.ts | POST | withUserAndCsrf | no | no | no |
| src/app/api/offers/counter/route.ts | POST | withUserAndCsrf | no | no | no |
| src/app/api/offers/reject/route.ts | POST | withUserAndCsrfToken | no | no | no |
| src/app/api/og/listing/route.tsx | GET | none | yes | no | yes |
| src/app/api/payments/callback/route.ts | GET, POST | none | no | yes | yes |
| src/app/api/payments/initialize/route.ts | POST | withUserAndCsrf | no | yes | yes |
| src/app/api/payments/retrieve/[token]/route.ts | GET | withUserRoute | no | yes | yes |
| src/app/api/payments/webhook/route.ts | POST | none | yes | no | yes |
| src/app/api/profile/route.ts | GET, PATCH | withUserRoute, withUserAndCsrf | no | yes | yes |
| src/app/api/reports/route.ts | POST | withAuthAndCsrf | no | no | no |
| src/app/api/saved-searches/[searchId]/route.ts | PATCH, DELETE | withAuthAndCsrf | no | no | no |
| src/app/api/saved-searches/notify/route.ts | GET, POST | none | no | no | no |
| src/app/api/saved-searches/route.ts | GET, POST | withAuth, withAuthAndCsrf | no | no | no |
| src/app/api/search/suggestions/route.ts | GET | none | no | yes | yes |
| src/app/api/seller-reviews/route.ts | POST | withAuthAndCsrf | no | yes | yes |
| src/app/api/sentry-example-api/route.ts | - | none | no | no | no |
| src/app/api/support/tickets/route.ts | POST, GET | withUserAndCsrf, withUserRoute | no | no | no |
