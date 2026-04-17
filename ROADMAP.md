# OtoBurada — 12-Month Product & Engineering Roadmap

> Base date: May 2026  
> Status: ~60% complete MVP, live in production  
> Goal: Build the leanest, fastest car-only marketplace — simpler than generic classifieds.

---

## Current State (April 2026)

| Layer | Status |
|-------|--------|
| Core listing CRUD | ✅ Complete |
| Admin moderation | ✅ Complete |
| Auth (email/password) | ✅ Complete |
| Search & filters | ✅ Complete |
| Favorites | ✅ Complete |
| WhatsApp CTA | ✅ Complete |
| Expert inspection | ✅ Complete |
| Messaging (in-app) | ✅ Complete |
| Pricing plans UI | ✅ Complete |
| Payment processing | 🔶 Iyzico skeleton (webhook now wired) |
| SEO (JSON-LD, sitemap) | ✅ Complete |
| Analytics (PostHog) | ✅ Complete |
| Security hardening | ✅ Complete |
| CI/CD | ✅ Complete |

---

## Roadmap

### Q2 2026 (May–July) — Monetization & Trust

**Goal:** First paying customers. Establish trust signals that differentiate from sahibinden.

| # | Feature | Effort | Impact | Notes |
|---|---------|--------|--------|-------|
| M1 | **Iyzico payment activation** | S | 🔴 Critical | Set `IYZICO_API_KEY` + `IYZICO_SECRET_KEY` in Vercel. Webhook is wired. Run `add-payments-webhook-support.sql`. |
| M2 | **Pricing plan seed data** | XS | High | Run `add-payments-webhook-support.sql` — seeds 4 plans (Başlangıç/Standart/Profesyonel/Kurumsal) |
| M3 | **Checkout page** | M | High | `/dashboard/pricing/checkout?plan=X` — Iyzico 3DS redirect flow |
| M4 | **Credit balance display** | S | Medium | Show `balance_credits` in dashboard header |
| M5 | **Doping purchase flow** | M | High | Connect `listing-doping-panel` to real payment (currently shows 503) |
| M6 | **Seller response rate tracking** | S | Medium | Track WhatsApp click → reply time via webhook |

**Cost estimate (Q2):**
- Iyzico: 2.9% + 0.25₺ per transaction (no monthly fee)
- Infrastructure: Vercel Pro (~$20/mo) + Supabase Pro (~$25/mo) + Upstash (~$10/mo)
- **Total: ~$55/mo fixed + transaction fees**

---

### Q3 2026 (August–October) — Growth & SEO

**Goal:** 10,000 active listings. Rank on Google for brand+city queries.

| # | Feature | Effort | Impact | Notes |
|---|---------|--------|--------|-------|
| G1 | **Brand/city SEO pages** | M | 🔴 Critical | `/satilik/bmw`, `/satilik/bmw/istanbul` — already in sitemap, need page components |
| G2 | **Google Vehicle Search eligibility** | S | High | JSON-LD `@type: Car` already done. Submit to Google Search Console. |
| G3 | **Saved search email alerts** | S | High | Cron is wired. Activate `RESEND_API_KEY`. |
| G4 | **Social login (Google OAuth)** | M | Medium | Supabase Auth supports it — add provider in dashboard |
| G5 | **Listing comparison (3-way)** | M | Medium | `/compare` page exists — complete the UI |
| G6 | **Price history chart** | S | Medium | `listing_price_history` table exists — build the chart component |
| G7 | **Bulk listing import (CSV)** | M | Medium | `/dashboard/bulk-import` exists — complete the server action |
| G8 | **Corporate gallery pages** | S | Medium | `/gallery/[businessSlug]` — seller's all listings |
| G9 | **Push notifications (PWA)** | M | Low | `manifest.json` exists — add service worker |

**Cost estimate (Q3):**
- Resend: Free tier (3,000 emails/mo) → $20/mo at scale
- No new infrastructure needed
- **Total: ~$55-75/mo**

---

### Q4 2026 (November–January 2027) — Scale & Retention

**Goal:** 50,000 registered users. Reduce churn with engagement features.

| # | Feature | Effort | Impact | Notes |
|---|---------|--------|--------|-------|
| S1 | **Supabase read replica** | XS | High | Enable in Supabase Dashboard → Settings → Database → Read Replicas. Zero code change. |
| S2 | **Redis cache for listings** | S | High | Already implemented for default view. Extend to brand/city pages. |
| S3 | **Infinite scroll on listings** | M | Medium | Replace pagination with cursor-based keyset pagination |
| S4 | **AI price estimation** | M | High | `/aracim-ne-kadar` page exists — connect to real ML model or market stats |
| S5 | **Seller dashboard analytics** | M | Medium | Show view counts, favorite counts, WhatsApp clicks per listing |
| S6 | **Review system improvements** | S | Medium | `seller_reviews` table exists — add review moderation |
| S7 | **Listing expiry renewal** | S | High | Let sellers renew from dashboard instead of re-creating |
| S8 | **Admin analytics dashboard** | M | Medium | RPC functions exist — build charts with Recharts |
| S9 | **Referral program** | L | Medium | Track referrals, credit both parties |

**Cost estimate (Q4):**
- Supabase Pro with read replica: ~$50/mo
- **Total: ~$80-100/mo**

---

### Q1 2027 (February–April) — Enterprise & API

**Goal:** Corporate accounts, API access, B2B revenue.

| # | Feature | Effort | Impact | Notes |
|---|---------|--------|--------|-------|
| E1 | **Corporate account dashboard** | L | High | Multi-user, shared credit pool, bulk operations |
| E2 | **Public API (REST)** | L | High | Rate-limited API for dealers — `api_erisimi` flag in Kurumsal plan |
| E3 | **Webhook notifications for sellers** | M | Medium | Notify seller systems when listing status changes |
| E4 | **White-label listings** | L | Medium | Embed OtoBurada listings on dealer websites |
| E5 | **Advanced fraud detection** | M | High | ML-based fraud scoring, auto-reject high-risk listings |
| E6 | **2FA (TOTP)** | M | Medium | Supabase Auth supports TOTP — add UI |
| E7 | **GDPR/KVKK compliance** | M | High | Data export, account deletion, consent management |
| E8 | **Mobile app (React Native)** | XL | High | Shared business logic, Supabase Realtime for chat |

**Cost estimate (Q1 2027):**
- Supabase Pro: ~$50/mo
- Vercel Pro: ~$20/mo
- Upstash: ~$20/mo
- Resend: ~$20/mo
- **Total: ~$110/mo + transaction fees**

---

## Infrastructure Scaling Thresholds

| Metric | Current | Action needed |
|--------|---------|---------------|
| Listings | < 10K | No action |
| Listings | 10K–100K | Add composite indexes (already done), enable read replica |
| Listings | 100K–1M | Supabase Pro + read replica + Redis cache expansion |
| Listings | > 1M | Table partitioning by `created_at` (yearly), Supabase Enterprise |
| Concurrent users | < 1K | No action |
| Concurrent users | 1K–10K | Vercel Pro (already handles this), Supabase connection pooler (PgBouncer) |
| Concurrent users | > 10K | Supabase Enterprise, dedicated connection pooler |

**Note on table partitioning:** Postgres partitioning adds operational complexity (migrations, index management, query planning). At current scale (< 100K listings), the existing composite indexes (`idx_listings_status_created_at`, `idx_listings_brand`, etc.) are sufficient. Revisit at 500K+ rows.

**Note on read replicas:** Supabase Pro includes one read replica. Enable it in the dashboard — zero code change required. The existing `createSupabaseAdminClient()` and `createSupabaseServerClient()` will automatically benefit from connection pooling.

---

## Revenue Model

| Stream | Unit Economics | When |
|--------|---------------|------|
| Standart plan | 299₺/mo per seller | Q2 2026 |
| Profesyonel plan | 599₺/mo per seller | Q2 2026 |
| Kurumsal plan | 1,499₺/mo per dealer | Q3 2026 |
| Doping (featured) | 50₺/7 days | Q2 2026 |
| Doping (urgent) | 50₺/7 days | Q2 2026 |
| Doping (highlighted) | 50₺/15 days | Q2 2026 |
| API access | Custom pricing | Q1 2027 |

**Break-even estimate:** ~200 paying sellers at Standart plan = 59,800₺/mo (~$1,800) covers all infrastructure costs.

---

## Effort Key

| Symbol | Effort |
|--------|--------|
| XS | < 2 hours |
| S | 2–8 hours |
| M | 1–3 days |
| L | 1–2 weeks |
| XL | 1+ month |
