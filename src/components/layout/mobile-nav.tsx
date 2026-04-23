"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";

import { getMobileNavigationItems } from "@/components/layout/public-navigation";
import { useAuthUser } from "@/components/shared/auth-provider";
import { cn } from "@/lib/utils";
import type { SearchSuggestionItem } from "@/types";

import { HeaderMobileNav } from "./header-mobile-nav";

interface MobileNavProps {
  searchSuggestions: SearchSuggestionItem[];
}

export function MobileNav({ searchSuggestions }: MobileNavProps) {
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAuthUser();
  // FAB sadece içerik keşif sayfalarında gösterilir.
  // Form, ödeme, mesaj ve işlem sayfalarında klavye/içerik üstüne binmemesi için gizlenir.
  const FAB_ALLOWED_PATHS = ["/", "/listings", "/favorites", "/compare"];
  const isListingDetailPage = pathname.startsWith("/listing/");
  const showFAB =
    FAB_ALLOWED_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"))) &&
    !pathname.startsWith("/dashboard/listings/create") &&
    !pathname.startsWith("/dashboard/listings/edit") &&
    !isListingDetailPage;

  // İlan detay sayfasında global bottom nav'ı gizle, çünkü orada özel sticky contact bar var.
  if (isListingDetailPage) return null;

  const mobileNavigationItems = getMobileNavigationItems(isReady ? isAuthenticated : true);

  return (
    <div className="lg:hidden">
      {/* Mobile FAB - Sadece keşif sayfalarında gösterilir, form/ödeme/mesaj sayfalarında gizlenir */}
      {showFAB && (
        <Link
          href="/dashboard/listings/create"
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transition-transform active:scale-90"
          aria-label="İlan Ver"
        >
          <Plus className="size-7" />
        </Link>
      )}

      <nav
        aria-label="Mobil alt navigasyon"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-safe backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {mobileNavigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[44px] transition-all active:scale-95",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-5.5", isActive ? "stroke-[2.5]" : "stroke-2")} />
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* New "Menü" Tab replacing the header hamburger */}
          <li className="flex-1">
            <Drawer.Root shouldScaleBackground>
              <Drawer.Trigger asChild>
                <button
                  className="flex w-full flex-col items-center justify-center gap-1 py-2.5 min-h-[44px] text-muted-foreground transition-all active:scale-95"
                  aria-label="Menüyü aç"
                >
                  <Menu className="size-5.5 stroke-2" />
                  <span className="text-[10px] font-bold tracking-tight">Menü</span>
                </button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
                <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] mt-24 flex max-h-[85vh] flex-col rounded-t-[32px] bg-background shadow-2xl focus:outline-none">
                  <div className="sticky top-0 mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />
                  <div className="flex-1 overflow-y-auto px-1 py-2 no-scrollbar">
                    <HeaderMobileNav searchSuggestions={searchSuggestions} />
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </li>
        </ul>
      </nav>
    </div>
  );
}
