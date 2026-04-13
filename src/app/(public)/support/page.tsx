import { getCurrentUser } from "@/lib/auth/session";
import { getUserTickets } from "@/services/support/ticket-service";
import { TicketForm } from "@/components/support/ticket-form";
import { TicketList } from "@/components/support/ticket-list";

const FAQ_CATEGORIES = [
  {
    icon: "BadgeCheck",
    iconColor: "text-emerald-500",
    title: "İLAN YÖNETİMİ",
    items: [
      { q: "İlan nasıl verilir?", a: "Dashboard'a gidip 'Yeni İlan Oluştur' butonuna tıklayın. 3 adımlı formu doldurarak ilanınızı oluşturabilirsiniz." },
      { q: "Resim kalitesi standartları", a: "Minimum 3 fotoğraf eklemeli, 1920x1080 çözünürlük önerilir. Araç ön, arka ve yan profilleri açıkça görünür olmalıdır." },
      { q: "İlan onay süreci", a: "İlanlarınız moderasyon ekibimiz tarafından 24 saat içinde incelenir. Onaylandıktan sonra yayına alınır." },
      { q: "Öne çıkarma özellikleri", a: "İlanlarınızı öne çıkarmak için 'Fiyatlandırma' bölümünden destekli ilan paketleri satın alabilirsiniz." },
    ],
  },
  {
    icon: "ShieldAlert",
    iconColor: "text-rose-500",
    title: "GÜVENLİK & GİZLİLİK",
    items: [
      { q: "Şüpheli ilan bildirimi", a: "Güvenmediğiniz bir ilan gördüğünüzde 'Şikayet Et' butonu ile bildirebilirsiniz. Moderasyon ekibimiz en kısa sürede inceler." },
      { q: "Güvenli ödeme rehberi", a: "Kapora göndermeden önce aracı görmeyi ve noter huzurunda işlem yapmayı öneriyoruz." },
      { q: "Kişisel verilerin korunması", a: "Verileriniz GDPR ve KVKK kapsamında korunmaktadır. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz." },
      { q: "Hesap güvenliği", a: "Güçlü bir şifre kullanın ve iki faktörlü doğrulamayı etkinleştirin." },
    ],
  },
  {
    icon: "FileText",
    iconColor: "text-primary",
    title: "TEKNİK KONULAR",
    items: [
      { q: "Şifremi unuttum", a: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısını kullanarak şifrenizi sıfırlayabilirsiniz." },
      { q: "E-posta doğrulama", a: "Kayıt olduktan sonra e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktive edebilirsiniz." },
      { q: "Mobil uygulama desteği", a: "OtoBurada'yı mobil tarayıcınızdan kullanabilir, cihazınıza 'Ana Ekle' seçeneğiyle kısayol oluşturabilirsiniz." },
      { q: "Tarayıcı uyumluluğu", a: "Chrome, Firefox, Safari ve Edge'in güncel sürümlerini destekliyoruz." },
    ],
  },
];

export default async function SupportPage() {
  const user = await getCurrentUser();
  let userTickets: Awaited<ReturnType<typeof getUserTickets>> = [];
  if (user) {
    try {
      userTickets = await getUserTickets(user.id);
    } catch {
      userTickets = [];
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Destek Merkezi</h1>
        <p className="text-slate-500 font-medium">
          Sorularınız için aşağıdaki SSS bölümünü inceleyin veya bir destek talebi oluşturun.
        </p>
      </div>

      {user && userTickets.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">Destek Taleplerim</h2>
          <TicketList tickets={userTickets} />
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-black text-slate-900">Sık Sorulan Sorular</h2>
        <div className="space-y-4">
          {FAQ_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className={`size-2 rounded-full ${cat.iconColor.replace("text-", "bg-")}`} />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">{cat.title}</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {cat.items.map((item, i) => (
                  <details key={i} className="group">
                    <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-slate-700 hover:text-slate-900 list-none">
                      {item.q}
                      <span className="size-5 rounded-full bg-slate-100 flex items-center justify-center text-xs group-open:rotate-180 transition-transform">▲</span>
                    </summary>
                    <p className="px-6 pb-4 text-sm text-slate-500">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-black text-slate-900 mb-6">Yeni Destek Talebi Oluştur</h2>
          {user ? (
            <TicketForm />
          ) : (
            <p className="text-sm text-slate-500">
              Destek talebi oluşturmak için{" "}
              <a href="/login?callbackUrl=/support" className="text-primary font-medium hover:underline">
                giriş yapmanız
              </a>{" "}
              gerekmektedir.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
