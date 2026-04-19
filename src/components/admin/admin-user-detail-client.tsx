"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  Zap,
  CreditCard,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Calendar,
  Package,
  Star,
  Activity,
  ChevronRight,
  TrendingUp,
  History,
  Store,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { safeFormatDate } from "@/lib/utils";
import type { UserDetailData } from "@/services/admin/user-details";
import { toggleUserBan, promoteUserToAdmin } from "@/services/admin/users";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { profile, dopings, listings, listingCount, activeListingCount, creditTransactions, dopingHistory } = detail;

  // Grant credits state
  const [credits, setCredits] = useState(10);
  const [creditNote, setCreditNote] = useState("");
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);

  // Grant doping state
  const [dopingListingId, setDopingListingId] = useState("");
  const [dopingTypes, setDopingTypes] = useState<string[]>(["featured"]);
  const [dopingDays] = useState(7);
  const [isGrantingDoping, setIsGrantingDoping] = useState(false);

  // User actions state
  const [isActioning, setIsActioning] = useState(false);

  const handleGrantCredits = async () => {
    if (!creditNote.trim()) {
      toast.error("Not alanı zorunludur.");
      return;
    }
    setIsGrantingCredits(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_credits", credits, note: creditNote }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Hata");
      toast.success(`${credits} kredi başarıyla tanımlandı.`);
      setCreditNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setIsGrantingCredits(false);
    }
  };

  const handleGrantDoping = async () => {
    if (!dopingListingId.trim()) {
      toast.error("İlan ID zorunludur.");
      return;
    }
    setIsGrantingDoping(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant_doping",
          listingId: dopingListingId,
          dopingTypes,
          durationDays: dopingDays,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Hata");
      toast.success("Doping başarıyla tanımlandı.");
      setDopingListingId("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setIsGrantingDoping(false);
    }
  };

  const handleBanToggle = async () => {
    setIsActioning(true);
    try {
      await toggleUserBan(userId, profile.isBanned);
      toast.success(profile.isBanned ? "Yasak kaldırıldı." : "Kullanıcı yasaklandı.");
      router.refresh();
    } catch {
      toast.error("İşlem başarısız.");
    } finally {
      setIsActioning(false);
    }
  };

  const handlePromote = async () => {
    if (profile.role === "admin") return;
    setIsActioning(true);
    try {
      await promoteUserToAdmin(userId);
      toast.success("Admin yetkisi verildi.");
      router.refresh();
    } catch {
      toast.error("İşlem başarısız.");
    } finally {
      setIsActioning(false);
    }
  };

  const toggleDopingType = (type: string) => {
    setDopingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <main className="space-y-8 p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon" className="group rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-900 hover:text-white hover:scale-110">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              {profile.fullName || "İsimsiz Kullanıcı"}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
                <Store size={12} strokeWidth={3} />
                {profile.userType === "professional" ? "Kurumsal Üye" : "Bireysel Üye"}
              </div>
              <span className="text-[10px] text-slate-300 font-mono tracking-tighter">
                #{userId.substring(0, 12)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
            profile.isBanned 
              ? "bg-rose-50 text-rose-600 border-rose-100" 
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            <div className={cn("size-2 rounded-full", profile.isBanned ? "bg-rose-500" : "bg-emerald-500 animate-pulse")} />
            {profile.isBanned ? "YASAKLI" : "HESAP AKTİF"}
          </div>
          <div className={cn(
            "px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
            profile.role === "admin" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"
          )}>
            <ShieldCheck size={14} strokeWidth={3} />
            {profile.role === "admin" ? "SİSTEM ADMİN" : "STANDART YETKİ"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stats Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Snapshot */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
             <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <TrendingUp size={28} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kredi Bakiyesi</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tighter">{profile.balanceCredits}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                <StatItem icon={<Package size={16} />} label="Toplam İlan" value={listingCount} color="blue" />
                <StatItem icon={<CheckCircle2 size={16} />} label="Yayında" value={activeListingCount} color="emerald" />
                <StatItem icon={<Activity size={16} />} label="Dopingler" value={dopings.length} color="amber" />
             </div>
          </div>

          {/* Profile Basic Info */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <User size={18} className="text-slate-400" />
              İletişim Detayları
            </h3>
            <div className="space-y-4">
              <InfoRow label="E-Posta" value={profile.email || "—"} />
              <InfoRow label="Telefon" value={profile.phone || "—"} />
              <InfoRow label="Lokasyon" value={profile.city || "—"} />
              <InfoRow label="Kayıt Tarihi" value={safeFormatDate(profile.createdAt, "dd MMMM yyyy")} />
            </div>
            
            <div className="pt-6 border-t border-slate-50 flex flex-col gap-3">
              <Button
                onClick={handleBanToggle}
                disabled={isActioning}
                variant="outline"
                className={cn(
                  "w-full rounded-2xl font-black text-[10px] tracking-widest h-12 flex items-center gap-2 transition-all active:scale-95 uppercase shadow-sm",
                  profile.isBanned
                    ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    : "border-rose-200 text-rose-600 hover:bg-rose-50"
                )}
              >
                {isActioning ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                {profile.isBanned ? "YASAĞI KALDIR" : "HESABI ENGELLE"}
              </Button>
            </div>
          </div>
        </div>

        {/* Center/Main Column */}
        <div className="lg:col-span-9 space-y-8">
           <Tabs defaultValue="actions" className="w-full">
              <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 h-14 w-fit shadow-sm">
                <TabsTrigger value="actions" className="rounded-xl px-8 font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  Yönetim & Aksiyonlar
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl px-8 font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  Aktivite Geçmişi
                </TabsTrigger>
                <TabsTrigger value="listings" className="rounded-xl px-8 font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  İlanlar ({listings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Kredi Tanımlama */}
                   <div className="rounded-[2.5rem] border border-indigo-100 bg-white p-10 shadow-xl shadow-indigo-50/20 space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                         <Gift size={120} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                          <Gift size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Hediye Kredi</h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Bakiyeye anında ekleme yap</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                           {[20, 50, 100, 250].map(val => (
                              <button 
                                key={val}
                                onClick={() => setCredits(val)}
                                className={cn(
                                  "py-2.5 rounded-xl border text-xs font-black transition-all",
                                  credits === val ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                                )}
                              >
                                {val}
                              </button>
                           ))}
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miktar ve Açıklama</Label>
                           <div className="flex gap-3">
                              <Input 
                                type="number" 
                                value={credits} 
                                onChange={e => setCredits(Number(e.target.value))}
                                className="w-24 h-12 rounded-2xl font-black text-center text-lg border-slate-200"
                              />
                              <Input 
                                value={creditNote}
                                onChange={e => setCreditNote(e.target.value)}
                                placeholder="İşlem notu (zorunlu)..."
                                className="flex-1 h-12 rounded-2xl font-medium border-slate-200"
                              />
                           </div>
                        </div>
                        <Button
                          onClick={handleGrantCredits}
                          disabled={isGrantingCredits || !creditNote.trim()}
                          className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-14 font-black text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-100 uppercase"
                        >
                          {isGrantingCredits ? <Loader2 className="animate-spin" /> : "KREDİLERİ TANIMLA"}
                        </Button>
                      </div>
                   </div>

                   {/* Doping Tanımlama */}
                   <div className="rounded-[2.5rem] border border-amber-100 bg-white p-10 shadow-xl shadow-amber-50/20 space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                         <Zap size={120} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                          <Zap size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Ücretsiz Doping</h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">İlana özel doping tanımla</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İlan Seçimi</Label>
                           <select
                              value={dopingListingId}
                              onChange={(e) => setDopingListingId(e.target.value)}
                              className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-100 transition-all appearance-none"
                           >
                              <option value="">— İlan Seçiniz —</option>
                              {listings.map(l => (
                                <option key={l.id} value={l.id}>{l.title} ({l.status})</option>
                              ))}
                           </select>
                        </div>

                        <div className="flex gap-2">
                          {(["featured", "urgent", "highlighted"] as const).map(type => (
                             <button
                                key={type}
                                onClick={() => toggleDopingType(type)}
                                className={cn(
                                  "flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                                  dopingTypes.includes(type) ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100" : "bg-white border-slate-100 text-slate-500 hover:border-amber-200"
                                )}
                             >
                               {DOPING_LABELS[type]}
                             </button>
                          ))}
                        </div>

                        <Button
                          onClick={handleGrantDoping}
                          disabled={isGrantingDoping || !dopingListingId || dopingTypes.length === 0}
                          className="w-full rounded-2xl bg-slate-900 hover:bg-black h-14 font-black text-[11px] tracking-[0.2em] shadow-xl shadow-slate-200 uppercase"
                        >
                          {isGrantingDoping ? <Loader2 className="animate-spin" /> : "DOPİNG UYGULA"}
                        </Button>
                      </div>
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Kredi Hareketleri */}
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <History size={18} className="text-indigo-500" />
                            Kredi Hareketleri
                          </h3>
                       </div>
                       <div className="space-y-4">
                          {creditTransactions.length > 0 ? creditTransactions.map(t => (
                             <div key={t.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                                <div className="space-y-1">
                                   <p className="text-xs font-black text-slate-800 tracking-tight">{t.description}</p>
                                   <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                      <Clock size={10} />
                                      {safeFormatDate(t.createdAt, "dd MMM HH:mm")}
                                   </div>
                                </div>
                                <div className={cn("text-sm font-black tracking-tighter", t.amount >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                   {t.amount >= 0 ? `+${t.amount}` : t.amount}
                                </div>
                             </div>
                          )) : (
                             <div className="py-12 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">Kayıt Bulunmuyor</div>
                          )}
                       </div>
                    </div>

                    {/* Doping Geçmişi */}
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={18} className="text-amber-500" />
                            Doping Başvuruları
                          </h3>
                       </div>
                       <div className="space-y-4">
                          {dopingHistory.length > 0 ? dopingHistory.map(d => (
                             <div key={d.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                                <div className="space-y-1">
                                   <p className="text-xs font-black text-slate-800 tracking-tight truncate max-w-[180px]">{d.listingTitle}</p>
                                   <div className="flex items-center gap-2">
                                      <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase px-2 py-0.5">
                                         {DOPING_LABELS[d.dopingType] || d.dopingType}
                                      </Badge>
                                      <span className="text-[10px] text-slate-400 font-bold">{safeFormatDate(d.createdAt, "dd MMM")}</span>
                                   </div>
                                </div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                   Tamamlandı
                                </div>
                             </div>
                          )) : (
                             <div className="py-12 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">Kayıt Bulunmuyor</div>
                          )}
                       </div>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="listings" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {listings.map(l => (
                       <Link key={l.id} href={`/listing/${l.id}`} className="block group">
                          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                             <div className="flex justify-between items-start mb-4">
                                <Badge className={cn(
                                   "border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-1",
                                   l.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                )}>
                                   {l.status}
                                </Badge>
                             </div>
                             <h4 className="font-black text-slate-900 truncate leading-none tracking-tight">{l.title}</h4>
                             <p className="text-[9px] text-slate-400 mt-2 font-mono uppercase">#{l.id.substring(0, 12)}</p>
                          </div>
                       </Link>
                    ))}
                    {listings.length === 0 && (
                       <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                          <Package size={48} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Henüz İlanı Yok</p>
                       </div>
                    )}
                 </div>
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </main>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600"
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-50 transition-colors hover:bg-slate-100">
       <div className="flex items-center gap-3">
          <div className={cn("size-8 rounded-xl flex items-center justify-center shadow-sm", colorMap[color])}>
             {icon}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-lg font-black text-slate-900 tracking-tighter">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-xs font-black text-slate-700 truncate">{value}</p>
    </div>
  );
}

function InfoRowBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}
