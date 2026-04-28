"use client";

import { Heart, PlusCircle } from "lucide-react";
import Link from "next/link";

import { useAuthUser } from "@/components/shared/auth-provider";

interface SiteHeaderAuthProps {
  favoritesHrefGuest: string;
  postListingHrefAuthenticated: string;
}

export function SiteHeaderAuth({
  favoritesHrefGuest,
  postListingHrefAuthenticated,
}: SiteHeaderAuthProps) {
  const { isReady, userId, user } = useAuthUser();
  const resolvedAuthenticated = Boolean(userId && user);

  const accountHref = resolvedAuthenticated ? "/dashboard" : "/login";
  const favoritesHref = resolvedAuthenticated ? "/dashboard/favorites" : favoritesHrefGuest;
  const postListingHref = resolvedAuthenticated ? postListingHrefAuthenticated : "/login";

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="hidden items-center gap-2 border-r border-border pr-4 md:flex">
        <Link
          href={favoritesHref}
          prefetch={false}
          className="text-muted-foreground transition-colors hover:text-red-500"
          aria-label="Favoriler"
        >
          <Heart size={22} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Auth state yüklenene kadar skeleton göster — "Giriş Yap" flash'ını önler */}
        {!isReady ? (
          <div className="size-8 rounded-full bg-muted animate-pulse" />
        ) : (
          <Link href={accountHref} prefetch={false} className="flex items-center gap-2 group p-1">
            {resolvedAuthenticated && user ? (
              <div className="size-10 overflow-hidden rounded-full border border-border bg-blue-500 flex items-center justify-center text-white text-xs font-bold select-none">
                <span>{user.email?.charAt(0).toUpperCase() ?? "U"}</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Giriş Yap
              </span>
            )}
          </Link>
        )}

        <Link
          href={postListingHref}
          prefetch={false}
          className="hidden h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-600 sm:flex"
        >
          <PlusCircle size={16} />
          İlan Ver
        </Link>
      </div>
    </div>
  );
}
