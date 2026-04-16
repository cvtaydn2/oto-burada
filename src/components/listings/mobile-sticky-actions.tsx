"use client"

import dynamic from "next/dynamic";

import { useAuthUser } from "@/components/shared/auth-provider";
import { formatCurrency } from "@/lib/utils";

const ContactActions = dynamic(
  () => import("./contact-actions").then((mod) => mod.ContactActions),
  {
    loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />,
  },
);

interface MobileStickyActionsProps {
    listingId: string;
    listingSlug: string;
    sellerId: string;
    price: number;
}

export function MobileStickyActions({ 
    listingId, 
    listingSlug,
    sellerId,
    price, 
}: MobileStickyActionsProps) {
    const { isAuthenticated } = useAuthUser();
    const loginUrl = `/login?next=${encodeURIComponent(`/listing/${listingSlug}`)}`;

    return (
        <div className="fixed bottom-[88px] left-0 right-0 z-50 lg:hidden px-4 py-3 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-full duration-500">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fiyat</span>
                    <div className="text-lg font-bold text-slate-900">
                        {formatCurrency(price)} <span className="text-xs font-semibold text-slate-400">TL</span>
                    </div>
                </div>

                <div className="flex-1 max-w-[240px]">
                    {isAuthenticated ? (
                        <ContactActions listingId={listingId} listingSlug={listingSlug} sellerId={sellerId} />
                    ) : (
                        <a
                            href={loginUrl}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 h-12 px-4 text-sm font-bold text-white shadow-lg active:scale-95 transition-all"
                        >
                            İletişim İçin Giriş Yap
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
