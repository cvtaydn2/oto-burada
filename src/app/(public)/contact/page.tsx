import { Mail, MessageCircle, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          İletişim
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Sorularınız, önerileriniz veya destek ihtiyacınız için bize ulaşın.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Mail size={24} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">E-Posta</h3>
          <p className="mt-2 text-sm text-slate-600">destek@otoburada.com</p>
        </div>

        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MessageCircle size={24} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">WhatsApp</h3>
          <p className="mt-2 text-sm text-slate-600">+90 (5xx) xxx xx xx</p>
        </div>

        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Phone size={24} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">Telefon</h3>
          <p className="mt-2 text-sm text-slate-600">Müşteri Hizmetleri</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl bg-slate-50 p-8 sm:p-12">
        <h2 className="text-xl font-bold text-slate-900">Sıkça Sorulan Sorular</h2>
        <div className="mt-6 space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900">İlan vermek ücretli mi?</h4>
            <p className="mt-2 text-sm text-slate-600">Hayır, OtoBurada üzerinde bireysel ilan vermek tamamen ücretsizdir.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">İlanım ne zaman onaylanır?</h4>
            <p className="mt-2 text-sm text-slate-600">Moderasyon ekibimiz ilanları genellikle 1-2 saat içerisinde inceleyip onaylamaktadır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
