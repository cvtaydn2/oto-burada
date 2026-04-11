export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kullanım Şartları</h1>
      <p className="mt-4 text-slate-600">Son güncelleme: 11 Nisan 2026</p>

      <div className="mt-10 prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">1. Kabul Edilme</h2>
          <p className="mt-2 text-slate-600">
            OtoBurada platformunu kullanarak, bu kullanım şartlarını kabul etmiş sayılırsınız. 
            Eğer bu şartları kabul etmiyorsanız, lütfen sitemizi kullanmayınız.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">2. İlan Verme Kuralları</h2>
          <ul className="mt-2 list-disc list-inside text-slate-600 space-y-2">
            <li>Sadece araç (otomobil) ilanları verilebilir.</li>
            <li>İlan bilgileri doğru ve güncel olmalıdır.</li>
            <li>Sahte veya yanıltıcı ilanlar süresiz olarak engellenir.</li>
            <li>Şasi numarası (VIN) doğrulaması zorunludur.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">3. Moderasyon</h2>
          <p className="mt-2 text-slate-600">
            OtoBurada, topluluk güvenliğini korumak adına herhangi bir ilanı sebep göstermeksizin 
            reddetme veya yayından kaldırma hakkını saklı tutar.
          </p>
        </section>
      </div>
    </div>
  );
}
