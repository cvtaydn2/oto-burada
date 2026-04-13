import { Heart, Home, LogIn, Search, User, UserPlus } from "lucide-react";

export interface PublicNavigationItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export const primaryNavigationItems: PublicNavigationItem[] = [
  {
    href: "/",
    label: "Ana Sayfa",
    icon: Home,
  },
  {
    href: "/listings",
    label: "İlanlar",
    icon: Search,
  },
];

export const mobileNavigationItems: PublicNavigationItem[] = [
  ...primaryNavigationItems,
];

export function getMobileNavigationItems(isAuthenticated: boolean): PublicNavigationItem[] {
  if (isAuthenticated) {
    return [
      ...primaryNavigationItems,
      {
        href: "/dashboard",
        label: "Hesabım",
        icon: User,
      },
      {
        href: "/dashboard/favorites",
        label: "Favoriler",
        icon: Heart,
      },
    ];
  }

  return [
    ...primaryNavigationItems,
    {
      href: "/login",
      label: "Giriş",
      icon: LogIn,
    },
    {
      href: "/register",
      label: "Kayıt Ol",
      icon: UserPlus,
    },
  ];
}
