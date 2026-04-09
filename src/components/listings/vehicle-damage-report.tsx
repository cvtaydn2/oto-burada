import { FileSearch, ShieldAlert } from "lucide-react";
import type { Listing } from "@/types";
import { formatNumber } from "@/lib/utils";
import { carPartLabels, carPartDamageStatusLabels, carParts } from "@/lib/constants/domain";

export function VehicleDamageReport({ listing }: { listing: Listing }) {
  const tramerAmount = listing.tramerAmount;
  const rawStatus = listing.damageStatusJson ?? {};
  
  const activeParts = carParts.filter((part) => {
    const status = rawStatus[part] as string;
    return status && status !== "bilinmiyor";
  });

  const hasStatusFields = activeParts.length > 0;
  
  const getBadgeColor = (status: keyof typeof carPartDamageStatusLabels) => {
    switch (status) {
      case "orjinal":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "degisen":
        return "bg-rose-100 text-rose-700 border-rose-300";
      case "boyali":
      case "lokal_boyali":
        return "bg-amber-100 text-amber-700 border-amber-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-5">
        <FileSearch className="text-indigo-600 size-5" />
        <h2 className="text-xl font-bold text-slate-900">Tramer ve Kaporta Durumu</h2>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 h-full">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Tramer Tutari</h3>
            {tramerAmount !== undefined && tramerAmount !== null ? (
              <p className="text-2xl font-bold text-slate-900">
                {tramerAmount === 0 ? "Yok" : `${formatNumber(tramerAmount)} TL`}
              </p>
            ) : (
              <p className="text-[13px] font-medium text-slate-600 flex items-center gap-1.5 border-l-2 border-amber-500 pl-2">
                <ShieldAlert className="size-4 text-amber-500 shrink-0" />
                Belirtilmemiş
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-3 leading-tight">
              Kesin bilgi icin Sms 5664 sorgulamasi yapmaniz tavsiye edilir.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Kaporta Durumu</h3>
          {hasStatusFields ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-3">
              {activeParts.map((part) => {
                const status = rawStatus[part] as keyof typeof carPartDamageStatusLabels;
                return (
                  <div key={part} className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-slate-500 tracking-tight">{carPartLabels[part]}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md border w-fit ${getBadgeColor(status)}`}>
                      {carPartDamageStatusLabels[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center p-8 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
               <span className="font-semibold text-slate-600">Detay girilmemiş</span>
               <span className="text-[12px] mt-1 text-center">Satıcı Tramer harici kaporta durumu işareti koymamıştır. Lütfen iletişime geçin.</span>
             </div>
          )}
        </div>
      </div>
    </section>
  );
}
