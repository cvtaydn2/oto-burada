export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gizlilik Politikası</h1>
      <p className="mt-4 text-slate-600">Son güncelleme: 11 Nisan 2026</p>

      <div className="mt-10 prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">1. Toplanan Veriler</h2>
          <p className="mt-2 text-slate-600">
            Kayıt aşamasında e-posta adresiniz ve adınız; ilan verme aşamasında ise telefon numaranız 
            ve araç bilgileriniz güvenli bir şekilde saklanmaktadır.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">2. Veri Kullanımı</h2>
          <p className="mt-2 text-slate-600">
            Verileriniz sadece ilanlarınızın yayınlanması ve sizinle iletişime geçilmesi amacıyla kullanılır. 
            Üçüncü taraflarla reklam amacıyla paylaşılmaz.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">3. Çerezler</h2>
          <p className="mt-2 text-slate-600">
            Platformumuzun çalışması için gerekli olan teknik çerezler dışında takip amaçlı çerez 
            ayarları kullanıcı onayı ile yönetilir.
          </p>
        </section>
      </div>
    </div>
  );
}
