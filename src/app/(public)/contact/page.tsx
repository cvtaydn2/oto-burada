import { Mail, MessageCircle, Phone, ChevronRight, HelpCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">İletişim & Destek</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tightest leading-tight text-slate-900 uppercase italic">
              CONCIERGE <span className="text-primary text-3xl md:text-5xl block mt-2">DESTEK MERKEZİ</span>
           </h1>
           <p className="mt-6 text-sm font-medium text-slate-400 italic leading-relaxed">
              OtoBurada deneyiminizde her adımda yanınızdayız. Teknik destekten kurumsal ilan yönetimine kadar tüm profesyonel yardım kanallarımıza buradan ulaşabilirsiniz.
           </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <ContactCard 
          icon={<MessageCircle size={32} />} 
          title="WHATSAPP" 
          description="En hızlı çözüm için danışmanlarımıza anlık mesaj gönderin."
          value="+90 (5xx) xxx xx xx"
          color="bg-emerald-500"
        />
        <ContactCard 
          icon={<Mail size={32} />} 
          title="E-POSTA" 
          description="Resmi başvurular ve detaylı teknik destek talepleri için."
          value="destek@otoburada.com"
          color="bg-slate-950"
        />
        <ContactCard 
          icon={<Phone size={32} />} 
          title="TELEFON" 
          description="Hafta içi 09:00 - 18:00 arası canlı destek hattımız."
          value="0850 xxx xx xx"
          color="bg-primary"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-10">
                 <div className="size-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white italic font-black text-xl shadow-lg shadow-slate-900/20">
                    <HelpCircle size={24} />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">Sıkça Sorulan Sorular</h2>
              </div>

              <div className="space-y-4">
                <FaqItem 
                  question="İlan vermek ücretli mi?" 
                  answer="Hayır, OtoBurada üzerinde bireysel ilan vermek tamamen ücretsizdir. Kurumsal üyelikler ve ek özellikler için mağaza paketlerimizi inceleyebilirsiniz."
                />
                <FaqItem 
                  question="İlanım ne zaman onaylanır?" 
                  answer="Moderasyon ekibimiz ilanları genellikle 1-2 saat içerisinde inceleyip onaylamaktadır. Mesai saatleri dışındaki ilanlar ertesi sabah öncelikli olarak değerlendirilir."
                />
                <FaqItem 
                  question="Expertiz zorunlu mu?" 
                  answer="Hayır, zorunlu değil. Ancak ekspertiz raporu eklenen ilanlar 'Showroom Elite' rozeti alır ve daha hızlı satış yapmanıza olanak tanır."
                />
              </div>
           </div>
        </div>

        <div className="lg:col-span-4">
           <div className="bg-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                 <ShieldCheck className="text-primary mb-6" size={48} />
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Güvenlik Önemli</h3>
                 <p className="text-sm font-medium text-indigo-100 italic leading-relaxed">
                    OtoBurada&apos;da güvenliğiniz bizim için en üst önceliktir. Şüpheli durumları bildirmek veya güvenli alım-satım rehberimize ulaşmak için her zaman yanınızdayız.
                 </p>
              </div>
              <Link 
                href="/legal/guvenlik-rehberi"
                className="relative z-10 mt-10 inline-flex items-center justify-between h-14 w-full px-6 rounded-2xl bg-white text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group italic"
              >
                GÜVENLİK REHBERİ
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, title, description, value, color }: { icon: React.ReactNode, title: string, description: string, value: string, color: string }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/30 group hover:scale-[1.02] transition-all duration-500">
      <div className={`size-16 rounded-2xl ${color} flex items-center justify-center text-white mb-6 shadow-xl shadow-slate-900/10`}>
        {icon}
      </div>
      <h3 className="text-sm font-black italic uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</h3>
      <p className="text-xl font-black italic text-slate-900 mb-4">{value}</p>
      <p className="text-xs font-medium text-slate-400 italic leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100/50 hover:border-primary transition-all group">
      <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 mb-3 group-hover:text-primary transition-colors">{question}</h4>
      <p className="text-xs font-medium text-slate-500 leading-relaxed italic">{answer}</p>
    </div>
  );
}
