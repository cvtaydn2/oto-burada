"use client";

import { MessageCircle, ShieldAlert, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SafeWhatsAppButtonProps {
  whatsappLink: string;
}

export function SafeWhatsAppButton({ whatsappLink }: SafeWhatsAppButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 h-12 px-4 text-[15px] text-white font-semibold shadow-lg shadow-green-500/25 transition-all hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/40"
        >
          <MessageCircle className="size-5" />
          WhatsApp ile İletişime Geç
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md bg-white border border-slate-200">
        <AlertDialogHeader className="text-left space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <ShieldAlert className="size-7" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-slate-900">
            Güvenlik Uyarısı
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 space-y-4" asChild>
            <div className="space-y-4">
              <p>
                Araç alım satımında kötü niyetli kişilere karşı lütfen dikkatli olun.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li className="flex gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>Aracı fiziki olarak görmeden <strong>kesinlikle kapora göndermeyin</strong>. Ön ödeme talep eden kişilere şüpheyle yaklaşın.</span>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>Ödemelerinizi ruhsat sahibi ile hesap sahibi adının aynı olduğu banka hesabına yapın.</span>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>Aşırı düşük fiyatlı &quot;fırsat&quot; gibi görünen ilanlara karşı özellikle temkinli yaklaşın.</span>
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 sm:space-x-3">
          <AlertDialogCancel className="w-full sm:w-auto h-12 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
            Geri Dön
          </AlertDialogCancel>
          <AlertDialogAction asChild className="w-full sm:w-auto h-12 bg-transparent p-0 hover:bg-transparent">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 w-full h-12 px-6 text-[15px] text-white font-semibold shadow-sm transition-all hover:from-green-600 hover:to-emerald-700"
            >
              Okudum, Mesaj Gönder
              <MessageCircle className="size-4" />
            </a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
