export const protectedPrefixes = ["/dashboard", "/admin"];
export const adminPrefixes = ["/admin"];
export const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth"];

// API Security Config
export const protectedApiPrefixes = [
  // NOTE: /api/listings GET is intentionally public marketplace search.
  // Auth-required listing operations are protected at route-level wrappers.
  "/api/dashboard",
  "/api/profile",
  "/api/chats",
  "/api/offers",
  "/api/reports",
  "/api/notifications",
  "/api/seller-reviews",
  "/api/saved-searches",
  "/api/support/tickets",
  "/api/payments",
];
export const adminApiPrefixes = ["/api/admin"];
export const publicApiRoutes = [
  "/api/health",
  "/api/health-check",
  "/api/contact",
  "/api/market/estimate",
  "/api/listings/view",
];

export function classifyRoute(pathname: string) {
  const isStaticAsset =
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/favicon") ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|webp|gif|woff|woff2|ttf|eot|css|js|map|webmanifest|json)$/
    );

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAdminRoute = adminPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api");

  // Specific API checks
  const isProtectedApi =
    protectedApiPrefixes.some((p) => pathname.startsWith(p)) && !publicApiRoutes.includes(pathname);
  const isAdminApi = adminApiPrefixes.some((p) => pathname.startsWith(p));
  const isPublicApi =
    publicApiRoutes.includes(pathname) || (isApiRoute && !isProtectedApi && !isAdminApi);

  return {
    isStaticAsset,
    isProtectedRoute,
    isAdminRoute,
    isAuthRoute,
    isApiRoute,
    isProtectedApi,
    isAdminApi,
    isPublicApi,
    needsAuth: isProtectedRoute || isProtectedApi || isAdminApi,
  };
}
