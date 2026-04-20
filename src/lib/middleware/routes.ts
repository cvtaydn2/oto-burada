export const protectedPrefixes = ["/dashboard", "/admin"];
export const adminPrefixes = ["/admin"];
export const authRoutes = ["/login", "/register"];

export function classifyRoute(pathname: string) {
  const isStaticAsset = 
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|woff|woff2|ttf|eot|css|js|map)$/);

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAdminRoute = adminPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api");

  return {
    isStaticAsset,
    isProtectedRoute,
    isAdminRoute,
    isAuthRoute,
    isApiRoute,
    needsAuth: isProtectedRoute || isAuthRoute || isApiRoute,
  };
}
