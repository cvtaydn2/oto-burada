// Lightweight authorization guards to promote a clean, reusable access control layer
// This file provides small, reusable wrappers around the existing session.ts helpers
// to be consumed by route handlers and server actions.

export { requireUser as ensureAuthenticated } from "@/lib/auth/session";
export { requireAdminUser as ensureAdmin } from "@/lib/auth/session";
export { getAuthenticatedUserOrThrow } from "@/lib/auth/session";
