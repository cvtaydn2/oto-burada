import { Search, HelpCircle, FileText, ShieldAlert, BadgeCheck, PhoneCall, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const categories = [
    {
      icon: <BadgeCheck className="text-emerald-500" />,
      title: "İLAN YÖNETİMİ",
      items: ["İlan nasıl verilir?", "Resim kalitesi standartları", "İlan onay süreci", "Öne çıkarma özellikleri"]
    },
    {
      icon: <ShieldAlert className="text-rose-500" />,
      title: "GÜVENLİK & GİZLİLİK",
      items: ["Şüpheli ilan bildirimi", "Güvenli ödeme rehberi", "Kişisel verilerin korunması", "Hesap güvenliği"]
    },
    {
      icon: <FileText className="text-primary" />,
      title: "TEKNİK KONULAR",
      items: ["Şifremi unuttum", "Avatar yükleme sorunları", "E-posta doğrulama", "Mobil uygulama desteği"]
    }
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Support Hero */}
      <div className="bg-slate-950 rounded-[4rem] p-12 lg:p-24 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-slate-900/50" />
         <div className="relative z-10 flex flex-col items-center text-center space-y-10">
            <div className="flex items-center gap-4">
               <div className="h-px w-12 bg-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Desk & Help Center</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tightest leading-tight uppercase italic">
               NASIL <span className="text-primary italic">YARDIMCI OLABİLİRİZ?</span>
            </h1>
            <div className="w-full max-w-2xl relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
               <input 
                 type="text" 
                 placeholder="Sorununuzu veya bir anahtar kelimeyi arayın..." 
                 className="h-20 w-full pl-16 pr-8 rounded-3xl bg-white/10 border-2 border-white/10 focus:border-primary focus:bg-white/20 outline-none transition-all font-bold italic text-lg text-white" 
               />
            </div>
         </div>
      </div>

      {/* Category Grid */}
      <div className="grid md:grid-cols-3 gap-10">
         {categories.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-8 group hover:border-primary transition-all">
               <div className="size-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                  {cat.icon}
               </div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{cat.title}</h3>
               <ul className="space-y-4">
                  {cat.items.map((item, i) => (
                    <li key={i}>
                       <Link href="#" className="flex items-center justify-between text-sm font-medium text-slate-400 italic hover:text-slate-900 transition-colors group/link">
                          {item}
                          <ChevronRight size={14} className="text-slate-200 group-hover/link:text-primary transition-colors" />
                       </Link>
                    </li>
                  ))}
               </ul>
            </div>
         ))}
      </div>

      {/* Urgent Support Banner */}
      <div className="bg-primary rounded-[3rem] p-10 lg:p-16 text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-3xl shadow-primary/20 italic">
         <div className="space-y-4 text-center lg:text-left">
            <h2 className="text-3xl font-black uppercase tracking-tightest">ACİL BİR DURUM MU VAR?</h2>
            <p className="text-sm font-bold text-white/80 max-w-md">Çözüm bulamadıysanız 7/24 aktif olan canlı destek hattımıza bağlanabilirsiniz.</p>
         </div>
         <div className="flex gap-6">
            <Link 
              href="/contact" 
              className="h-16 px-10 rounded-2xl bg-white text-slate-950 flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-xl shadow-slate-900/10 italic"
            >
              <PhoneCall size={20} />
              CANLI DESTEK
            </Link>
         </div>
      </div>
    </div>
  );
}
