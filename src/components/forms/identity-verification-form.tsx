"use client";

import { Mail, ShieldCheck } from "lucide-react";

interface IdentityVerificationFormProps {
  userId: string;
  isVerified: boolean;
}

export function IdentityVerificationForm({ isVerified }: IdentityVerificationFormProps) {
  if (isVerified) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-100">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Kimliğiniz Doğrulandı</h4>
          <p className="text-xs text-emerald-700/80">Güvenli profil rozetine sahipsiniz.</p>
        </div>
        <ShieldCheck className="ml-auto text-emerald-500" size={20} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-4">
      <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
        <Mail size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground/90">E-posta Doğrulama</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          İlan verebilmek için e-posta adresinizi doğrulamanız gerekmektedir. Kayıt sırasında
          gönderilen doğrulama bağlantısını kontrol edin.
        </p>
      </div>
    </div>
  );
}
