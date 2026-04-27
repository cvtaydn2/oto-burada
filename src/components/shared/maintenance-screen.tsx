import { ShieldAlert, Wrench } from "lucide-react";

export function MaintenanceScreen() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen flex flex-col items-center justify-center bg-background p-6"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto size-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm relative">
          <Wrench size={32} className="animate-pulse" />
          <div className="absolute -top-2 -right-2 size-8 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-rose-600">
            <ShieldAlert size={14} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sistem Bakımda</h1>
          <p className="text-muted-foreground font-medium">
            Size daha iyi hizmet verebilmek için planlı bakım çalışması yapıyoruz. Lütfen kısa bir
            süre sonra tekrar deneyin.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="size-1.5 rounded-full bg-amber-500 animate-ping" />
            OtoBurada Engine
          </div>
        </div>
      </div>
    </main>
  );
}
