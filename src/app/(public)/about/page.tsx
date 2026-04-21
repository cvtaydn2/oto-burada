import { ShieldCheck, Zap, Users, Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 space-y-8">
           <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary italic">Vizyon & Misyon</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-bold tracking-tightest leading-tight text-foreground uppercase italic">
              YENİ NESİL <span className="text-primary block">OTO SHOWROOM</span>
           </h1>
           <p className="text-lg font-medium text-muted-foreground italic leading-relaxed">
              OtoBurada, sadece bir ilan sitesi değil; güvenin, hızın ve şeffaflığın dijital buluşma noktasıdır. Amacımız, araç alım-satım sürecini bir yorgunluktan çıkarıp premium bir deneyime dönüştürmektir.
           </p>
           <div className="flex gap-4">
             <div className="px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/20">
                <span className="block text-3xl font-bold italic tracking-tighter">Ücretsiz</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Bireysel İlan</span>
             </div>
             <div className="px-6 py-4 rounded-2xl bg-card border border-border/50 shadow-sm shadow-slate-200/20">
                <span className="block text-3xl font-bold italic tracking-tighter text-primary">Güvenli</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Moderasyonlu Platform</span>
             </div>
           </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="aspect-[4/3] rounded-[4rem] bg-muted overflow-hidden shadow-3xl shadow-slate-200/50">
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 to-transparent z-10" />
             <Image
               src="/images/hero_bg.png"
               alt="OtoBurada görseli"
               fill
               className="object-cover"
               sizes="(min-width: 1024px) 50vw, 100vw"
             />
          </div>
          <div className="absolute -bottom-8 -left-8 bg-card p-8 rounded-2xl shadow-sm border border-border/50 z-20 hidden md:block">
             <ShieldCheck size={48} className="text-emerald-500 mb-4" />
             <h4 className="font-bold italic uppercase tracking-tighter text-foreground">%100 Güvenli</h4>
             <p className="text-[10px] font-medium text-muted-foreground/70">Doğrulanmış İlanlar</p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-slate-950 rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-10">
           <h2 className="text-4xl md:text-5xl font-bold italic uppercase tracking-tighter">Showroom Elite <span className="text-primary italic">Felsefesi</span></h2>
           <p className="text-muted-foreground/70 font-medium italic leading-relaxed">
             Pazarın karmaşıklığını ve güvensizliğini ortadan kaldırmak için &quot;Elite&quot; standartlarını belirledik. Her ilan, her kullanıcı ve her etkileşim bizim için bir prestij meselesidir.
           </p>

           <div className="grid md:grid-cols-3 gap-8 w-full text-left mt-10">
              <EliteValueCard 
                icon={<Zap className="text-amber-400" />}
                title="MAKSİMUM HIZ"
                desc="İlan verme sürecinden, onaylanma anına kadar her saniyeyi optimize ettik."
              />
              <EliteValueCard 
                icon={<Trophy className="text-primary" />}
                title="PREMIUM KALİTE"
                desc="Görsel standartlarımız ve kullanıcı arayüzümüzle sektörün zirvesindeyiz."
              />
              <EliteValueCard 
                icon={<Users className="text-emerald-400" />}
                title="KOŞULSUZ GÜVEN"
                desc="WhatsApp odaklı iletişim ve doğrulanmış profillerle riskleri sıfırlıyoruz."
              />
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex flex-col items-center text-center space-y-8 pb-10">
         <h2 className="text-4xl font-bold italic uppercase tracking-tightest">BU HİKAYENİN PARÇASI OLUN</h2>
         <div className="flex flex-wrap justify-center gap-6">
            <Link 
              href="/register" 
              className="h-16 px-10 rounded-2xl bg-slate-900 text-white flex items-center gap-3 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm shadow-slate-900/20 italic group"
            >
              ŞİMDİ KATIL
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact" 
              className="h-16 px-10 rounded-2xl bg-card border-2 border-border/50 text-foreground flex items-center gap-3 text-sm font-bold uppercase tracking-widest hover:border-primary transition-all italic group"
            >
              BİZE ULAŞIN
            </Link>
         </div>
      </section>
    </div>
  );
}

function EliteValueCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-card/5 border border-white/10 p-8 rounded-3xl hover:bg-card/10 transition-all group">
       <div className="size-12 rounded-2xl bg-card/10 flex items-center justify-center mb-6 group- transition-transform">
          {icon}
       </div>
       <h3 className="text-sm font-bold italic uppercase tracking-widest mb-3">{title}</h3>
       <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">{desc}</p>
    </div>
  );
}
