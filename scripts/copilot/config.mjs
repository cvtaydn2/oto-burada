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
  "src/app/dashboard/listings/page.tsx",
  "src/components/forms/listing-create-form.tsx",
  "src/features/marketplace/components/my-listings-panel.tsx"
]);
export const conversationHistory = [];
