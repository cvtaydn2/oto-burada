"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { verifyIdentityAction } from "@/lib/auth/profile-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface IdentityVerificationFormProps {
  userId: string;
  isVerified: boolean;
}

export function IdentityVerificationForm({ userId, isVerified }: IdentityVerificationFormProps) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  if (isVerified) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Kimliiniz Doruland</h4>
          <p className="text-xs text-emerald-700/80">E-Devlet (ENDS) entegrasyonu ile gǬvenli profil rozetine sahipsiniz.</p>
        </div>
        <CheckCircle2 className="ml-auto text-emerald-500" size={20} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await verifyIdentityAction(userId, formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(result.success);
      setLoading(false);
      setShowForm(false);
      router.refresh();
    }
  };

  if (!showForm) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xl shadow-blue-100 italic font-black text-xs tracking-tighter uppercase">
            ENDS
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black italic tracking-tight text-blue-900">Kimlik Dorulama Gerekli</h4>
            <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
              lanlarnzda &quot;DorulanmY Satc&quot; rozeti gsterilmesi ve gǬven puannzn artması iin kimliinizi dorulamanz neririz.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-black italic uppercase tracking-tighter"
        >
          Dorulamay BaYlat
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_0_rgba(15,23,42,1)] transition-all">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="text-slate-900" size={20} />
        <h3 className="font-black italic uppercase tracking-tighter text-slate-900">E-DEVLET (ENDS) GiriYi</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">T.C. Kimlik Numaras</Label>
          <Input 
            name="tcId"
            placeholder="11122233344"
            maxLength={11}
            required
            className="h-12 bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-0 rounded-xl font-bold tracking-widest text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ad Soyad (Kimlikteki Gibi)</Label>
          <Input 
            name="fullName"
            placeholder="AHMET YILMAZ"
            required
            className="h-12 bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-0 rounded-xl font-bold uppercase"
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-3 flex gap-3">
          <AlertCircle className="size-5 text-slate-400 shrink-0" />
          <p className="text-[10px] leading-normal text-slate-500 font-medium">
            Bilgileriniz sadece dorulama iin kullanlr ve ǬǬncǬ taraflarla paylaYlmaz. 
            Bu bir MVP simǬlasyonudur; gerek E-Devlet API baYlants üretim ortamnda gereklidir.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="button"
            variant="ghost"
            onClick={() => setShowForm(false)}
            disabled={loading}
            className="flex-1 h-12 rounded-xl border border-slate-100 font-black italic uppercase tracking-tighter"
          >
            Vazge
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="flex-[2] h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black italic uppercase tracking-tighter transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Dorula ve Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
