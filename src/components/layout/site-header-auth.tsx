"use client";

import { Heart, PlusCircle, User } from "lucide-react";
import Link from "next/link";

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
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="hidden items-center gap-2 border-r border-border pr-4 md:flex">
        <Link
          href={favoritesHref}
          prefetch={false}
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-red-500 focus-visible:ring-2 focus-visible:ring-primary outline-none"
          aria-label="Favoriler"
        >
          <Heart size={22} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Auth state yüklenene kadar skeleton göster — "Giriş Yap" flash'ını önler */}
        {!isReady ? (
          <div className="size-11 rounded-full bg-muted animate-pulse" />
        ) : (
          <Link
            href={accountHref}
            prefetch={false}
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label={isAuthenticated ? "Hesabım" : "Giriş Yap"}
          >
            {isAuthenticated && user ? (
              <div className="size-9 overflow-hidden rounded-full border border-border bg-primary flex items-center justify-center text-white text-xs font-bold select-none">
                <span>{user.email?.charAt(0).toUpperCase() ?? "U"}</span>
              </div>
            ) : (
              <User size={22} strokeWidth={1.5} aria-hidden="true" />
            )}
          </Link>
        )}

        <Link
          href={postListingHref}
          prefetch={false}
          className="hidden h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 sm:flex"
        >
          <PlusCircle size={16} />
          İlan Ver
        </Link>
      </div>
    </div>
  );
}
