import { Heart, Home, LogIn, Search, ShieldCheck, User, UserPlus } from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: typeof Home;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
  requiresAdmin?: boolean;
  showInBottomNav?: boolean;
}

export const navigationConfig: NavigationItem[] = [
  {
    href: "/",
    label: "Ana Sayfa",
    icon: Home,
    showInBottomNav: true,
  },
  {
    href: "/listings",
    label: "İlanlar",
    icon: Search,
    showInBottomNav: true,
  },
  {
    href: "/dashboard",
    label: "Hesabım",
    icon: User,
    requiresAuth: true,
    showInBottomNav: true,
  },
  {
    href: "/dashboard/favorites",
    label: "Favoriler",
    icon: Heart,
    requiresAuth: true,
    showInBottomNav: true,
  },
  {
    href: "/login",
    label: "Giriş",
    icon: LogIn,
    requiresGuest: true,
    showInBottomNav: false, // Bottom nav'dan kaldırıldı, sadece Menü'de olacak
  },
  {
    href: "/register",
    label: "Kayıt Ol",
    icon: UserPlus,
    requiresGuest: true,
    showInBottomNav: false, // Bottom nav'dan kaldırıldı, sadece Menü'de olacak
  },
  {
    href: "/admin",
    label: "Admin Panel",
    icon: ShieldCheck,
    requiresAdmin: true,
  },
];

/**
 * Returns filtered navigation items based on current auth state.
 * CENTRAL SOURCE OF TRUTH for navigation visibility.
 */
export function getFilteredNavigation({
  isAuthenticated,
  isAdmin,
  isReady,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReady: boolean;
}): NavigationItem[] {
  // Loading state: Return only public items to prevent flickering
  if (!isReady) {
    return navigationConfig.filter(
      (item) => !item.requiresAuth && !item.requiresGuest && !item.requiresAdmin
    );
  }

  return navigationConfig.filter((item) => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresGuest && isAuthenticated) return false;
    return true;
  });
}
