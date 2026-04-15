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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { UserDetailData } from "@/services/admin/users";
import { toggleUserBan, promoteUserToAdmin } from "@/services/admin/user_actions";
import { cn } from "@/lib/utils";

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
  const { profile, payments, dopings, listings, listingCount, activeListingCount } = detail;

  // Grant credits state
  const [credits, setCredits] = useState(10);
  const [creditNote, setCreditNote] = useState("");
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);

  // Grant doping state
  const [dopingListingId, setDopingListingId] = useState("");
  const [dopingTypes, setDopingTypes] = useState<string[]>(["featured"]);
  const [dopingDays, setDopingDays] = useState(7);
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
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white border border-transparent hover:border-slate-200">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {profile.fullName || "İsimsiz Kullanıcı"}
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">
            ID: {userId.substring(0, 16)}...
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {profile.isBanned ? (
            <Badge className="bg-rose-100 text-rose-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5">
              Yasaklı
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5">
              Aktif
            </Badge>
          )}
          <Badge className={cn(
            "border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5",
            profile.role === "admin" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          )}>
            {profile.role === "admin" ? "Admin" : profile.userType === "professional" ? "Kurumsal" : "Bireysel"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol kolon — profil + aksiyonlar */}
        <div className="space-y-6">
          {/* Profil Kartı */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-800">Profil Bilgileri</h3>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Telefon" value={profile.phone || "—"} />
              <Row label="Şehir" value={profile.city || "—"} />
              <Row label="Kredi Bakiyesi" value={
                <span className="font-black text-indigo-600">{profile.balanceCredits} kredi</span>
              } />
              <Row label="Doğrulandı" value={
                profile.isVerified
                  ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Evet</span>
                  : <span className="text-slate-400 font-bold flex items-center gap-1"><XCircle size={14} /> Hayır</span>
              } />
              {profile.businessName && <Row label="İşletme" value={profile.businessName} />}
              <Row label="Kayıt" value={new Date(profile.createdAt).toLocaleDateString("tr-TR")} />
            </div>
          </div>

          {/* İlan Özeti */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-800">İlan Özeti</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-2xl font-black text-slate-800">{listingCount}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Toplam</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-black text-emerald-700">{activeListingCount}</p>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Yayında</p>
              </div>
            </div>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-800 mb-4">Hızlı Aksiyonlar</h3>
            {profile.role !== "admin" && (
              <Button
                onClick={handlePromote}
                disabled={isActioning}
                className="w-full rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white font-bold text-xs h-11 flex items-center gap-2 justify-start px-4 transition-all"
              >
                {isActioning ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Admin Yetkisi Ver
              </Button>
            )}
            <Button
              onClick={handleBanToggle}
              disabled={isActioning}
              variant="outline"
              className={cn(
                "w-full rounded-xl font-bold text-xs h-11 flex items-center gap-2 justify-start px-4 transition-all",
                profile.isBanned
                  ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  : "border-rose-200 text-rose-600 hover:bg-rose-50"
              )}
            >
              {isActioning ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
              {profile.isBanned ? "Yasağı Kaldır" : "Kullanıcıyı Yasakla"}
            </Button>
          </div>
        </div>

        {/* Orta + Sağ kolon */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hediye Kredi Tanımlama */}
          <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Hediye Kredi Tanımla</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                  Mevcut bakiye: {profile.balanceCredits} kredi
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kredi Miktarı</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                  className="h-11 rounded-xl font-black text-center"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Not (Zorunlu)</Label>
                <Input
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Örn: Kampanya hediyesi, müşteri memnuniyeti..."
                  className="h-11 rounded-xl font-medium"
                />
              </div>
            </div>
            <Button
              onClick={handleGrantCredits}
              disabled={isGrantingCredits || !creditNote.trim()}
              className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-[10px] tracking-widest uppercase h-11 px-6 shadow-lg shadow-indigo-100 gap-2"
            >
              {isGrantingCredits ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
              {isGrantingCredits ? "Tanımlanıyor..." : `${credits} Kredi Tanımla`}
            </Button>
          </div>

          {/* Hediye Doping Tanımlama */}
          <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Hediye Doping Tanımla</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                  İlan ID girerek ücretsiz doping uygula
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İlan Seç</Label>
                {listings.length > 0 ? (
                  <select
                    value={dopingListingId}
                    onChange={(e) => setDopingListingId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="">— İlan seçin —</option>
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">Bu kullanıcının ilanı yok.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doping Türleri</Label>
                <div className="flex gap-2 flex-wrap">
                  {(["featured", "urgent", "highlighted"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleDopingType(type)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        dopingTypes.includes(type)
                          ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100"
                          : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                      )}
                    >
                      {DOPING_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Süre (Gün)</Label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDopingDays(d)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        dopingDays === d
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {d} Gün
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={handleGrantDoping}
              disabled={isGrantingDoping || !dopingListingId.trim() || dopingTypes.length === 0}
              className="mt-4 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-[10px] tracking-widest uppercase h-11 px-6 shadow-lg shadow-amber-100 gap-2 text-white"
            >
              {isGrantingDoping ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isGrantingDoping ? "Uygulanıyor..." : "Doping Uygula"}
            </Button>
          </div>

          {/* Aktif Dopingler */}
          {dopings.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800">Aktif Dopingler ({dopings.length})</h3>
              </div>
              <div className="space-y-3">
                {dopings.map((d) => (
                  <div key={d.listingId} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-black text-slate-800 truncate max-w-[200px]">{d.listingTitle}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.listingId.substring(0, 12)}...</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {d.dopingTypes.map((type) => (
                        <Badge key={type} className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase tracking-widest">
                          {DOPING_LABELS[type] ?? type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ödeme Geçmişi */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                Ödeme Geçmişi ({payments.length})
              </h3>
            </div>
            {payments.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CreditCard size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Henüz ödeme kaydı yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutar</th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sağlayıcı</th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 text-xs text-slate-500 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-300" />
                            {new Date(p.created_at).toLocaleDateString("tr-TR")}
                          </div>
                        </td>
                        <td className="py-3 text-sm font-black text-slate-800">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 text-xs font-bold text-slate-500 uppercase">{p.provider}</td>
                        <td className="py-3">
                          <Badge className={cn(
                            "border-none text-[9px] font-black uppercase tracking-widest",
                            p.status === "success" ? "bg-emerald-100 text-emerald-700" :
                            p.status === "pending" ? "bg-amber-100 text-amber-700" :
                            "bg-rose-100 text-rose-700"
                          )}>
                            {p.status === "success" ? "Başarılı" : p.status === "pending" ? "Bekliyor" : "Başarısız"}
                          </Badge>
                        </td>
                        <td className="py-3 text-[10px] text-slate-400 font-mono max-w-[120px] truncate">
                          {p.metadata
                            ? (p.metadata.dopingTypes as string[] | undefined)?.join(", ") ??
                              (p.metadata.planId as string | undefined) ??
                              "—"
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}
