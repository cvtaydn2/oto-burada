import { Home, LogIn, Search, UserPlus } from "lucide-react";

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
