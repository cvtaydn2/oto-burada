"use client";

import { Gift, Loader2, Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {} from "@/lib";
import { cn } from "@/lib/utils";

const DOPING_LABELS: Record<string, string> = {
  featured: "Vitrin",
  urgent: "Acil",
  highlighted: "Öne Çıkar",
};

interface AdminUserActionCardsProps {
  listings: {
    id: string;
    slug: string;
    title: string;
    brand: string;
    model: string;
    status: string;
  }[];
  onGrantCredits: (credits: number, note: string) => Promise<void>;
  onGrantDoping: (listingId: string, types: string[]) => Promise<void>;
}

export function AdminUserActionCards({
  listings,
  onGrantCredits,
  onGrantDoping,
}: AdminUserActionCardsProps) {
  const [credits, setCredits] = useState(10);
  const [creditNote, setCreditNote] = useState("");
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);

  const [dopingListingId, setDopingListingId] = useState("");
  const [dopingTypes, setDopingTypes] = useState<string[]>(["featured"]);
  const [isGrantingDoping, setIsGrantingDoping] = useState(false);

  const handleCredits = async () => {
    setIsGrantingCredits(true);
    await onGrantCredits(credits, creditNote);
    setCreditNote("");
    setIsGrantingCredits(false);
  };

  const handleDoping = async () => {
    setIsGrantingDoping(true);
    await onGrantDoping(dopingListingId, dopingTypes);
    setDopingListingId("");
    setIsGrantingDoping(false);
  };

  const toggleDopingType = (type: string) => {
    setDopingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Kredi Tanımlama */}
      <div className="rounded-2xl border border-indigo-100 bg-white p-10 shadow-sm shadow-indigo-50/20 space-y-8 relative overflow-hidden group">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
            <Gift size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Hediye Kredi</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Bakiyeye anında ekleme yap
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[20, 50, 100, 250].map((val) => (
              <Button
                key={val}
                onClick={() => setCredits(val)}
                className={cn(
                  "py-2.5 rounded-xl border text-xs font-bold transition-all",
                  credits === val
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100"
                    : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                )}
              >
                {val}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Miktar ve Açıklama
            </Label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-24 h-12 rounded-2xl font-bold text-center text-lg border-slate-200"
              />
              <Input
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                placeholder="İşlem notu (zorunlu)..."
                className="flex-1 h-12 rounded-2xl font-medium border-slate-200"
              />
            </div>
          </div>
          <Button
            onClick={handleCredits}
            disabled={isGrantingCredits || !creditNote.trim()}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-14 font-bold text-[11px] tracking-[0.2em] shadow-sm shadow-indigo-100 uppercase"
          >
            {isGrantingCredits ? <Loader2 className="animate-spin" /> : "KREDİLERİ TANIMLA"}
          </Button>
        </div>
      </div>

      {/* Doping Tanımlama */}
      <div className="rounded-2xl border border-amber-100 bg-white p-10 shadow-sm shadow-amber-50/20 space-y-8 relative overflow-hidden group">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-200">
            <Zap size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Ücretsiz Doping</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              İlana özel doping tanımla
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              İlan Seçimi
            </Label>
            <select
              value={dopingListingId}
              onChange={(e) => setDopingListingId(e.target.value)}
              className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-100 appearance-none"
            >
              <option value="">— İlan Seçiniz —</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {(["featured", "urgent", "highlighted"] as const).map((type) => (
              <Button
                key={type}
                onClick={() => toggleDopingType(type)}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                  dopingTypes.includes(type)
                    ? "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-100"
                    : "bg-white border-slate-100 text-slate-500 hover:border-amber-200"
                )}
              >
                {DOPING_LABELS[type]}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleDoping}
            disabled={isGrantingDoping || !dopingListingId || dopingTypes.length === 0}
            className="w-full rounded-2xl bg-slate-900 hover:bg-black h-14 font-bold text-[11px] tracking-[0.2em] shadow-sm shadow-slate-200 uppercase"
          >
            {isGrantingDoping ? <Loader2 className="animate-spin" /> : "DOPİNG UYGULA"}
          </Button>
        </div>
      </div>
    </div>
  );
}
