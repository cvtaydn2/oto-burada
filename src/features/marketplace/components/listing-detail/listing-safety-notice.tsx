import { ShieldCheck } from "lucide-react";

export function ListingSafetyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
            Güvenli karar notları
          </div>
          <p className="text-sm font-semibold leading-6 text-amber-900">
            İletişimi kolaylaştırırken güven kontrolünü sakin ve net tut.
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-xs leading-5 text-amber-900/90">
        <li>Aracı görmeden veya ekspertiz sürecini konuşmadan kapora göndermeyin.</li>
        <li>Ödemeyi noter devri ve ruhsat sahibi teyidiyle birlikte planlayın.</li>
        <li>İlanda eksik kalan detayları ilk mesajda net sorarak süreci hızlandırın.</li>
      </ul>
    </div>
  );
}
