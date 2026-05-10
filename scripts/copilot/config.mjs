import process from "node:process";
import { loadLocalEnv } from "../load-local-env.mjs";

// Çevre değişkenlerini yükle
loadLocalEnv();

export const apiKey = process.env.CLAUDE_NETIVA_KEY;
export const baseUrl = process.env.CLAUDE_NETIVA_URL || "https://apiv3.netiva.com.tr";
export const model = "claude-opus-4-6";

// Aktif Oturum Durumu (Memory & Context)
// Aktif Oturum Durumu (Memory & Context)
export const activeContextFiles = new Set([
  "src/app/(public)/(auth)/forgot-password/page.tsx",
  "src/app/(public)/(auth)/login/page.tsx",
  "src/app/(public)/(auth)/register/page.tsx",
  "src/app/(public)/(auth)/reset-password/page.tsx",
  "src/app/(public)/(marketplace)/aracim-ne-kadar/page.tsx",
  "src/app/(public)/(marketplace)/compare/page.tsx",
  "src/app/(public)/(marketplace)/favorites/page.tsx",
  "src/app/(public)/(marketplace)/galeri/[slug]/page.tsx",
  "src/app/(public)/(marketplace)/listing/[slug]/page.tsx",
  "src/app/(public)/(marketplace)/listings/filter/page.tsx",
  "src/app/(public)/(marketplace)/listings/page.tsx",
  "src/app/(public)/(marketplace)/pricing/page.tsx",
  "src/app/(public)/(marketplace)/seller/[id]/page.tsx",
  "src/app/(public)/(marketplace)/page.tsx",
  "src/app/(public)/contact/page.tsx",
  "src/app/(public)/support/page.tsx",
  "src/app/admin/analytics/page.tsx",
  "src/app/admin/listings/page.tsx",
  "src/app/admin/questions/page.tsx",
  "src/app/admin/reports/page.tsx",
  "src/app/admin/tickets/page.tsx",
  "src/app/admin/users/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/dashboard/bulk-import/page.tsx",
  "src/app/dashboard/favorites/page.tsx",
  "src/app/dashboard/listings/create/page.tsx",
  "src/app/dashboard/listings/edit/[id]/page.tsx",
  "src/app/dashboard/listings/page.tsx",
  "src/app/dashboard/messages/page.tsx",
  "src/app/dashboard/notifications/page.tsx",
  "src/app/dashboard/payments/page.tsx",
  "src/app/dashboard/pricing/page.tsx",
  "src/app/dashboard/profile/corporate/page.tsx",
  "src/app/dashboard/profile/page.tsx",
  "src/app/dashboard/reservations/page.tsx",
  "src/app/dashboard/saved-searches/page.tsx",
  "src/app/dashboard/stok/page.tsx",
  "src/app/dashboard/teklifler/page.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/layout.tsx"
]);
export const conversationHistory = [];
