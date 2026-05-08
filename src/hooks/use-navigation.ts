"use client";

import { useAuthUser } from "@/features/shared/components/auth-provider";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function useNavigation() {
  const { user, isReady } = useAuthUser();
  const authLoading = !isReady;

  const allItems: NavItem[] = [];
  const bottomNavItems: NavItem[] = [];
  const isAuthenticated = !!user;
  const isLoading = authLoading;

  return {
    allItems,
    isAuthenticated,
    isLoading,
    bottomNavItems,
    isReady,
    user,
  };
}
