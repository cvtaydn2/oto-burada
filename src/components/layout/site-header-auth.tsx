"use client";

import { Heart, PlusCircle, User } from "lucide-react";
import Link from "next/link";

import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { useNavigation } from "@/hooks/use-navigation";

interface SiteHeaderAuthProps {
  favoritesHrefGuest: string;
  postListingHrefAuthenticated: string;
}

export function SiteHeaderAuth({
  favoritesHrefGuest,
  postListingHrefAuthenticated,
}: SiteHeaderAuthProps) {
  const { isReady, isAuthenticated, user } = useNavigation();

  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const favoritesHref = isAuthenticated ? "/dashboard/favorites" : favoritesHrefGuest;
  const postListingHref = isAuthenticated ? postListingHrefAuthenticated : "/login";

  return (
    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
      <div className="hidden items-center gap-2 border-r border-border pr-3 lg:flex lg:pr-4">
        {isAuthenticated && <NotificationCenter />}
        <Link
          href={favoritesHref}
          prefetch={false}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Favoriler"
        >
          <Heart size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden xl:inline">Favoriler</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Mobile Notification Center (Not visible on LG which relies on desktop slot above) */}
        <div className="lg:hidden">{isAuthenticated && <NotificationCenter />}</div>

        {!isReady ? (
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse lg:h-11 lg:w-11" />
        ) : (
          <Link
            href={accountHref}
            prefetch={false}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:h-11 lg:px-3"
            aria-label={isAuthenticated ? "Hesabım" : "Giriş Yap"}
          >
            {isAuthenticated && user ? (
              <div className="flex size-8 overflow-hidden rounded-full border border-border bg-primary items-center justify-center text-white text-xs font-bold select-none lg:size-9">
                <span>{user.email?.charAt(0).toUpperCase() ?? "U"}</span>
              </div>
            ) : (
              <User size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className="hidden text-sm font-medium xl:inline">
              {isAuthenticated ? "Hesabım" : "Giriş Yap"}
            </span>
          </Link>
        )}

        <Link
          href={postListingHref}
          prefetch={false}
          className="hidden h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 lg:inline-flex"
        >
          <PlusCircle size={16} />
          İlan Ver
        </Link>
      </div>
    </div>
  );
}
