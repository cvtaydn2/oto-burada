import { ShieldCheck, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Visual Side */}
      <div className="hidden lg:flex relative bg-slate-950 items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#0060ff20,transparent)]" />
          <div className="absolute w-[800px] h-[800px] bg-primary/5 blur-[150px] -bottom-40 -left-40 rounded-full" />
        </div>
        
        <div className="relative z-10 w-full max-w-lg space-y-12">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Güvenlik Güncelleme</span>
          </div>
          <h2 className="text-7xl font-black italic text-white leading-tight tracking-tightest uppercase">
            YENI <span className="text-primary tracking-widest block">SIFRE</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed italic border-l-4 border-primary pl-8">
            Güvenliğiniz bizim önceliğimizdir. Lütfen tahmin edilmesi zor, güçlü bir parola belirleyerek dijital showroom&apos;unuza tekrar erişim sağlayın.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 lg:p-24 relative overflow-hidden bg-slate-50/50">
        <div className="w-full max-w-md space-y-12 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">Şifreyi <span className="text-primary italic">Yenile</span></h1>
            <p className="text-sm font-medium text-slate-500 italic">Yeni parolanızı belirleyin ve güvenle kullanmaya devam edin.</p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black px-1 uppercase tracking-widest text-slate-400 italic group-focus-within:text-primary transition-colors">YENİ ŞİFRE</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-16 w-full pl-14 pr-6 rounded-[1.5rem] bg-white border-2 border-slate-100 shadow-xl shadow-slate-200/40 focus:border-primary outline-none transition-all font-black italic tracking-tighter text-slate-900" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black px-1 uppercase tracking-widest text-slate-400 italic group-focus-within:text-primary transition-colors">ŞİFRE TEKRAR</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-16 w-full pl-14 pr-6 rounded-[1.5rem] bg-white border-2 border-slate-100 shadow-xl shadow-slate-200/40 focus:border-primary outline-none transition-all font-black italic tracking-tighter text-slate-900" 
                  required 
                />
              </div>
            </div>

            <button className="h-16 w-full rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-900/20 italic group">
              ŞİFREYİ GÜNCELLE
              <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </form>

          <div className="pt-8 border-t border-slate-200">
             <div className="flex items-start gap-4 p-6 rounded-3xl bg-slate-900/5 border border-slate-100 italic">
                <div className="size-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                   <Lock size={16} />
                </div>
                <div className="space-y-1">
                   <p className="text-[11px] font-black text-slate-900 uppercase">Güvenlik İpucu</p>
                   <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                     En az 8 karakter, bir büyük harf ve bir rakam içeren şifreler her zaman daha güvenlidir.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
