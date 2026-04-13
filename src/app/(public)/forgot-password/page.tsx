import { Fingerprint, Mail, KeyRound, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Güvenlik Protokolü</span>
          </div>
          <h2 className="text-7xl font-black italic text-white leading-tight tracking-tightest uppercase">
            HESAP <span className="text-primary tracking-widest block">ERİSİMİ</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed italic border-l-4 border-primary pl-8">
            Dijital anahtarınızı mı kaybettiniz? Endişelenmeyin, güvenli sıfırlama prosedürü ile erişiminizi dakikalar içinde geri kazanın.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 lg:p-24 relative overflow-hidden bg-slate-50/50">
        <div className="w-full max-w-md space-y-12 relative z-10">
          <div className="space-y-4">
            <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors italic">
              <ChevronLeft size={14} />
              GİRİŞE DÖN
            </Link>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">Şifremi <span className="text-primary italic">Unuttum</span></h1>
            <p className="text-sm font-medium text-slate-500 italic">E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.</p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black px-1 uppercase tracking-widest text-slate-400 italic group-focus-within:text-primary transition-colors">E-POSTA ADRESİ</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="email" 
                  placeholder="isim@mail.com" 
                  className="h-16 w-full pl-14 pr-6 rounded-[1.5rem] bg-white border-2 border-slate-100 shadow-xl shadow-slate-200/40 focus:border-primary outline-none transition-all font-black italic tracking-tighter text-slate-900" 
                  required 
                />
              </div>
            </div>

            <button className="h-16 w-full rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-900/20 italic group">
              SIFIRLAMA BAĞLANTISI GÖNDER
              <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </form>

          <div className="pt-8 border-t border-slate-200">
             <div className="flex items-center gap-4 p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
                <ShieldAlert className="text-primary shrink-0" size={24} />
                <p className="text-[11px] font-bold text-indigo-900/60 leading-relaxed italic">
                  Eğer e-posta almazsanız, lütfen spam klasörünü kontrol edin veya 10 dakika sonra tekrar deneyin.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldAlert({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
