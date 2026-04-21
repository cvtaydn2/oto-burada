import { Mail, MessageCircle, Phone, ChevronRight, HelpCircle, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { ContactForm } from "@/components/shared/contact-form";
import { features } from "@/lib/features";

export const metadata = {
  title: "İletişim | OtoBurada",
  description: "OtoBurada ile iletişime geçin. Soru, öneri veya işbirliği için ekibimize ulaşın.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 space-y-8 sm:space-y-12 md:space-y-16">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-2 sm:mb-4">Bize Ulaşın</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Soru, öneri veya işbirlikleri için ekibimizle iletişime geçebilirsiniz. Size en kısa sürede dönüş yapacağız.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContactCard
          icon={<MessageCircle size={28} />}
          title="WhatsApp"
          description="En hızlı çözüm için danışmanlarımıza anlık mesaj gönderin."
          value="destek@otoburada.com"
          color="bg-emerald-500"
        />
        <ContactCard
          icon={<Mail size={28} />}
          title="E-Posta"
          description="Resmi başvurular ve detaylı teknik destek talepleri için."
          value="destek@otoburada.com"
          color="bg-slate-900"
        />
        <ContactCard
          icon={<Phone size={28} />}
          title="Destek"
          description="Hafta içi 09:00 - 18:00 arası destek ekibimize ulaşın."
          value="destek@otoburada.com"
          color="bg-blue-500"
        />
      </div>

      {/* Main Content: Contact Info + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">

        {/* Left: Blue Info Panel */}
        <div className="bg-blue-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-8">İletişim Bilgilerimiz</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-blue-300 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold">Genel Merkez</h4>
                  <p className="text-blue-100 text-sm mt-1">
                    Levent Mah. Çayır Çimen Sk. No:1<br />Beşiktaş, İstanbul
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={20} className="text-blue-300 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold">Müşteri Hizmetleri</h4>
                  <p className="text-blue-100 text-sm mt-1">
                    destek@otoburada.com<br />
                    <span className="text-xs opacity-75">Hafta içi 09:00 - 18:00</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={20} className="text-blue-300 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold">E-Posta</h4>
                  <p className="text-blue-100 text-sm mt-1">destek@otoburada.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 flex space-x-4">
            <a href="https://x.com/otoburada" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-card/10 flex items-center justify-center hover:bg-card/20 transition" aria-label="X (Twitter)">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://instagram.com/otoburada" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-card/10 flex items-center justify-center hover:bg-card/20 transition" aria-label="Instagram">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://linkedin.com/company/otoburada" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-card/10 flex items-center justify-center hover:bg-card/20 transition" aria-label="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {features.tickets ? "Mesaj Gönderin" : "İletişime Geçin"}
          </h2>
          {features.tickets ? (
            <ContactForm />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Şu anda sadece WhatsApp ve E-Posta üzerinden destek vermekteyiz. Lütfen yandaki iletişim kanallarını kullanın.
              </p>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm font-bold">
                WhatsApp: destek@otoburada.com
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="bg-card rounded-3xl p-10 border border-border/50 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                <HelpCircle size={24} />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Sıkça Sorulan Sorular</h2>
            </div>
            <div className="space-y-4">
              <FaqItem question="İlan vermek ücretli mi?" answer="Hayır, OtoBurada üzerinde bireysel ilan vermek tamamen ücretsizdir. Kurumsal üyelikler ve ek özellikler için mağaza paketlerimizi inceleyebilirsiniz." />
              <FaqItem question="İlanım ne zaman onaylanır?" answer="Moderasyon ekibimiz ilanları genellikle 1-2 saat içerisinde inceleyip onaylamaktadır. Mesai saatleri dışındaki ilanlar ertesi sabah öncelikli olarak değerlendirilir." />
              <FaqItem question="Ekspertiz zorunlu mu?" answer="Hayır, zorunlu değil. Ancak ekspertiz raporu eklenen ilanlar daha hızlı satış yapmanıza olanak tanır." />
              <FaqItem question="Şüpheli ilan nasıl bildiririm?" answer="İlan detay sayfasındaki 'İlanı Şikayet Et' butonunu kullanarak moderasyon ekibimize bildirebilirsiniz." />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-indigo-900 rounded-3xl p-10 text-white shadow-sm h-full flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-card/5 blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <ShieldCheck className="text-blue-400 mb-6" size={48} />
              <h3 className="text-2xl font-bold mb-4">Güvenlik Önemli</h3>
              <p className="text-sm text-indigo-100 leading-relaxed">
                OtoBurada&apos;da güvenliğiniz bizim için en üst önceliktir. Şüpheli durumları bildirmek veya güvenli alım-satım rehberimize ulaşmak için her zaman yanınızdayız.
              </p>
            </div>
            <Link
              href="/support"
              className="relative z-10 mt-10 inline-flex items-center justify-between h-14 w-full px-6 rounded-2xl bg-card text-foreground text-xs font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all group"
            >
              Destek Merkezi
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, title, description, value, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all group">
      <div className={`size-14 rounded-2xl ${color} flex items-center justify-center text-white mb-5 shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-2">{title}</h3>
      <p className="text-lg font-bold text-foreground mb-3">{value}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 hover:border-blue-200 transition-all">
      <h4 className="text-sm font-bold text-foreground mb-2">{question}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );
}
