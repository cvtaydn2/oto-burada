"use client";

import { useMemo } from "react";

import { getFilteredNavigation } from "@/features/layout/components/public-navigation";
import { useAuthUser } from "@/features/shared/components/auth-provider";

/**
 * SOLID: Separation of Concerns
 * This hook encapsulates all navigation filtering logic.
 * UI components just consume the result.
 */
export function useNavigation() {
  const auth = useAuthUser();

  // Auth durumu tam yüklenene kadar (isReady) sadece herkese açık item'ları dön
  const allItems = useMemo(() => {
    return getFilteredNavigation({
      isAuthenticated: auth.isAuthenticated,
      isAdmin: auth.isAdmin,
      isReady: auth.isReady,
    });
  }, [auth.isAuthenticated, auth.isAdmin, auth.isReady]);

  const bottomNavItems = useMemo(() => allItems.filter((item) => item.showInBottomNav), [allItems]);

  return {
    allItems,
    bottomNavItems,
    isReady: auth.isReady,
    isAdmin: auth.isAdmin,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: !auth.isReady, // Daha açık bir flag
  };
}
