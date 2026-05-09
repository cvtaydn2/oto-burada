"use client";

import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Share2,
  User,
} from "lucide-react";
import Image from "next/image";

import { TrustBadge } from "@/components/shared/trust-badge";
import { Button } from "@/components/ui/button";
import {} from "@/lib";
import { cn } from "@/lib/utils";
import { type Profile } from "@/types";

interface SellerHeaderSectionProps {
  seller: Profile;
  totalListingsCount: number;
  featuredListingCount: number;
  memberSinceYear: number | null;
  trustSummary: {
    signals: string[];
  };
  trustUI: {
    styles: {
      bg: string;
      border: string;
      text: string;
    };
    label: string;
    subMessage?: string;
    isContactable: boolean;
    tone: string;
  };
}

export function SellerHeaderSection({
  seller,
  totalListingsCount,
  featuredListingCount,
  memberSinceYear,
  trustSummary,
  trustUI,
}: SellerHeaderSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border p-6 lg:p-8 shadow-sm transition-colors",
        trustUI.styles.bg,
        trustUI.styles.border
      )}
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background/50 border border-border shadow-sm">
            {seller.avatarUrl ? (
              <Image
                src={seller.avatarUrl}
                alt={seller.fullName || "Satıcı"}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <User size={32} className="text-muted-foreground/30" />
            )}
          </div>

          {/* Info */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={cn("text-xl font-bold tracking-tight", trustUI.styles.text)}>
                {seller.fullName || "İsimsiz Satıcı"}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border",
                  trustUI.styles.bg,
                  trustUI.styles.text,
                  trustUI.styles.border
                )}
              >
                {trustUI.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground/70">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                {seller.city || "Konum belirtilmedi"}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                {memberSinceYear ?? new Date().getFullYear()}&apos;den beri üye
              </div>
            </div>

            {trustUI.subMessage && (
              <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-tight mt-1">
                {trustUI.subMessage}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-2 sm:w-auto">
          {seller.phone && trustUI.isContactable && (
            <Button
              size="lg"
              className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#1fb355] text-white font-bold text-xs tracking-widest uppercase md:px-8 shadow-sm"
              asChild
            >
              <a
                href={`https://wa.me/${seller.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare size={16} className="mr-2 fill-current" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl">
            <Share2 size={18} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Aktif İlan", value: totalListingsCount, icon: Car },
          { label: "Aktif Vitrin", value: featuredListingCount, icon: CheckCircle2 },
          { label: "Üyelik Yılı", value: memberSinceYear ?? "—", icon: Clock },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-background/50 p-4 transition-colors hover:bg-background/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-muted-foreground/60">
                <stat.icon size={18} />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground leading-none">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Factors */}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-border">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 mr-2">
          GÜVEN SİNYALLERİ
        </span>
        {trustSummary.signals.map((signal) => (
          <div
            key={signal}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-tight",
              trustUI.styles.bg,
              trustUI.styles.text,
              trustUI.styles.border
            )}
          >
            <CheckCircle2 size={11} />
            {signal}
          </div>
        ))}
        <div className="ml-auto">
          <TrustBadge
            badgeLabel={trustUI.label}
            score={seller.trustScore ?? 0}
            tone={
              trustUI.tone === "verified"
                ? "emerald"
                : trustUI.tone === "trusted"
                  ? "blue"
                  : trustUI.tone === "warning"
                    ? "amber"
                    : trustUI.tone === "amber"
                      ? "amber"
                      : trustUI.tone === "rose"
                        ? "rose"
                        : "slate"
            }
          />
        </div>
      </div>
    </section>
  );
}
