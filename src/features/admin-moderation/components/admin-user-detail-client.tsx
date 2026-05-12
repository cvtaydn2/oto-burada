"use client";

import { Activity, Clock, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  grantUserCredits,
  grantUserDoping,
  toggleUserBan,
} from "@/features/admin-moderation/services/user-actions";
import type { UserDetailData } from "@/features/admin-moderation/services/user-details";
import {} from "@/lib";
import { safeFormatDate } from "@/lib/datetime/date-utils";
import { trust } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";

import { AdminUserActionCards } from "./admin-user-action-cards";
import { AdminUserHeader } from "./admin-user-header";
import { AdminUserStatsSidebar } from "./admin-user-stats-sidebar";

interface AdminUserDetailClientProps {
  detail: UserDetailData;
  userId: string;
}

const DOPING_LABELS: Record<string, string> = {
  featured: "Vitrin",
  urgent: "Acil",
  highlighted: "Öne Çıkar",
};

export function AdminUserDetailClient({ detail, userId }: AdminUserDetailClientProps) {
  const router = useRouter();
  const {
    profile,
    dopings,
    listings,
    listingCount,
    activeListingCount,
    creditTransactions,
    dopingHistory,
  } = detail;
  const [isActioning, setIsActioning] = useState(false);

  const handleGrantCredits = async (credits: number, note: string) => {
    setIsActioning(true);
    const res = await grantUserCredits(userId, credits, note);
    if (res.success) {
      toast.success(`${credits} kredi başarıyla tanımlandı.`);
      router.refresh();
    } else {
      toast.error(res.error || "İşlem başarısız");
    }
    setIsActioning(false);
  };

  const handleGrantDoping = async (listingId: string, dopingTypes: string[]) => {
    setIsActioning(true);
    const res = await grantUserDoping(userId, listingId, dopingTypes);
    if (res.success) {
      toast.success("Doping başarıyla tanımlandı.");
      router.refresh();
    } else {
      toast.error(res.error || "İşlem başarısız");
    }
    setIsActioning(false);
  };

  const handleBanToggle = async () => {
    setIsActioning(true);
    try {
      await toggleUserBan(userId, profile.isBanned);
      toast.success(profile.isBanned ? "Yasak kaldırıldı." : "Kullanıcı yasaklandı.");
      router.refresh();
    } catch {
      toast.error("İşlem başarısız.");
    }
    setIsActioning(false);
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      <AdminUserHeader
        userId={userId}
        fullName={profile.fullName}
        userType={profile.userType}
        isBanned={profile.isBanned}
        banReason={profile.banReason}
        role={profile.role}
        trustScore={profile.trustScore}
        verificationStatus={profile.verificationStatus}
        idVerified={profile.isVerified}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <AdminUserStatsSidebar
            profile={profile}
            listingCount={listingCount}
            activeListingCount={activeListingCount}
            featuredCount={dopings.length}
            isActioning={isActioning}
            onBanToggle={handleBanToggle}
          />
        </div>

        <div className="lg:col-span-9 space-y-8">
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 h-14 w-fit shadow-sm">
              <TabsTrigger
                value="actions"
                className="rounded-xl px-8 font-bold text-[10px] tracking-widest uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                Yönetim
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl px-8 font-bold text-[10px] tracking-widest uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                Geçmiş
              </TabsTrigger>
              <TabsTrigger
                value="listings"
                className="rounded-xl px-8 font-bold text-[10px] tracking-widest uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                İlanlar ({listings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="actions"
              className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <AdminUserActionCards
                listings={listings}
                onGrantCredits={handleGrantCredits}
                onGrantDoping={handleGrantDoping}
              />
            </TabsContent>

            <TabsContent
              value="history"
              className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-8">
                    <History size={18} className="text-indigo-500" />
                    Kredi Hareketleri
                  </h3>
                  <div className="space-y-4">
                    {creditTransactions.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100/50"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 tracking-tight">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <Clock size={10} /> {safeFormatDate(t.createdAt, "dd MMM HH:mm")}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "text-sm font-bold tracking-tighter",
                            t.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}
                        >
                          {t.amount >= 0 ? `+${t.amount}` : t.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-8">
                    <Activity size={18} className="text-amber-500" />
                    Doping Başvuruları
                  </h3>
                  <div className="space-y-4">
                    {dopingHistory.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100/50"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 tracking-tight truncate max-w-[180px]">
                            {d.listingTitle}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-bold uppercase px-2 py-0.5">
                              {DOPING_LABELS[d.dopingType] || d.dopingType}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {safeFormatDate(d.createdAt, "dd MMM")}
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Tamamlandı
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="listings"
              className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listings.map((l) => (
                    <Link
                      key={l.id}
                      href={`/admin/listings?q=${l.slug || l.title}&status=all`}
                      className="block group"
                    >
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                          <Badge
                            className={cn(
                              "border-none text-[8px] font-bold uppercase tracking-widest px-2.5 py-1",
                              l.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : l.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {l.status === "approved"
                              ? trust.admin.listingStatus.approved
                              : l.status === "pending"
                                ? trust.admin.listingStatus.pending
                                : l.status}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400">
                            ID: {l.id.substring(0, 4)}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 truncate tracking-tight">
                          {l.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 mt-2 font-mono uppercase truncate">
                          {l.brand} {l.model}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Bu kullanıcının henüz ilanı bulunmuyor
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
