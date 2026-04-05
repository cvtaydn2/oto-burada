# UI Update Progress

## Screens to Update

| Source (.ai-studio-import) | Target Route (Next.js) | Status | Notes |
| --- | --- | --- | --- |
| Home.tsx | `src/app/(public)/page.tsx` | Complete | |
| ListingDetail.tsx | `src/app/(public)/listing/[slug]/page.tsx` | Complete | |
| Login.tsx | `src/app/(public)/login/page.tsx` | Complete | |
| Register.tsx | `src/app/(public)/register/page.tsx` | Complete | |
| Dashboard.tsx | `src/app/dashboard/page.tsx` | Complete | |
| DashboardListings.tsx | `src/app/dashboard/listings/page.tsx` | Complete | |
| CreateListing.tsx | `src/app/dashboard/listings/create/page.tsx` | Complete | |
| Favorites.tsx | `src/app/dashboard/favorites/page.tsx` | Complete | |
| Profile.tsx | `src/app/dashboard/profile/page.tsx` | Complete | |
| SellerProfile.tsx | `src/app/(public)/seller/[id]/page.tsx` | Complete | New screen |
| Compare.tsx | `src/app/(public)/compare/page.tsx` | Complete | New screen |
| DashboardSavedSearches.tsx | `src/app/dashboard/saved-searches/page.tsx` | Complete | New screen |
| Messages.tsx | `src/app/dashboard/messages/page.tsx` | Skipped | MVP relies on WhatsApp CTA |
| Notifications.tsx | `src/app/dashboard/notifications/page.tsx` | Complete | New screen |

## Components to Strengthen (from .figma-import)

- `DashboardLayout.tsx` -> `src/app/dashboard/layout.tsx`
- `Gallery.tsx`
- `Layout.tsx` -> `src/app/(public)/layout.tsx`
- `ListingCard.tsx`
- `PriceAnalysisCard.tsx`
- `TrustBadge.tsx`
- Shadcn UI components update

## Plan

1. Migrate and strengthen shared components taking inputs from `.figma-import`.
2. Update public facing pages (`Home`, `ListingDetail`, `Login`, `Register`).
3. Update Auth/Dashboard pages (`Dashboard`, `Profile`, `Favorites`, `DashboardListings`, `CreateListing`).
4. Implement new/missing screens if they fit the scope (like Seller Profile).
5. Ensure responsive design and proper data wiring.
