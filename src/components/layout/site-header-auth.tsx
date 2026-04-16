"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, PlusCircle } from "lucide-react";

import { useAuthUser } from "@/components/shared/auth-provider";

interface SiteHeaderAuthProps {
  favoritesHrefGuest: string;
  postListingHrefAuthenticated: string;
}

export function SiteHeaderAuth({
  favoritesHrefGuest,
  postListingHrefAuthenticated,
}: SiteHeaderAuthProps) {
  const { isAuthenticated, userId } = useAuthUser();

  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const favoritesHref = isAuthenticated ? "/dashboard/favorites" : favoritesHrefGuest;
  const postListingHref = isAuthenticated ? postListingHrefAuthenticated : "/login";

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="hidden items-center gap-2 border-r border-border pr-4 md:flex">
        <Link
          href={favoritesHref}
          className="text-muted-foreground transition-colors hover:text-red-500"
          title="Favoriler"
        >
          <Heart size={22} strokeWidth={1.5} />
        </Link>
        <Link
          href="/dashboard/messages"
          className="text-muted-foreground transition-colors hover:text-primary"
          title="Mesajlar"
        >
          <MessageSquare size={22} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link href={accountHref} className="flex items-center gap-2 group">
          {isAuthenticated && userId ? (
            <div className="size-8 overflow-hidden rounded-full border border-gray-200">
              <Image
                src={`https://i.pravatar.cc/150?u=${userId}`}
                alt="Profil"
                className="h-full w-full object-cover"
                width={32}
                height={32}
              />
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Giriş Yap
            </span>
          )}
        </Link>

        <Link
          href={postListingHref}
          className="hidden h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-600 sm:flex"
        >
          <PlusCircle size={16} />
          İlan Ver
        </Link>
      </div>
    </div>
  );
}
