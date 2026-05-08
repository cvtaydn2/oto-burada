import { Loader2 } from "lucide-react";

export function PaymentProcessing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin relative z-10" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">İşleminiz Kontrol Ediliyor</h2>
        <p className="text-slate-400 font-bold mt-1">Lütfen sayfayı kapatmayın...</p>
      </div>
    </div>
  );
}
