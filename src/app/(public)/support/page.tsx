import Link from "next/link";

import { FaqAccordion } from "@/components/shared/faq-accordion";
import { TicketForm } from "@/components/support/ticket-form";
import { TicketList } from "@/components/support/ticket-list";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserTickets } from "@/services/support/ticket-service";

const FAQ_CATEGORIES = [
  {
    icon: "BadgeCheck",
    iconColor: "text-emerald-500",
    title: "İLAN YÖNETİMİ",
    items: [
      {
        q: "İlan nasıl verilir?",
        a: "Dashboard'a gidip 'Yeni İlan Oluştur' butonuna tıklayın. 3 adımlı formu doldurarak ilanınızı oluşturabilirsiniz.",
      },
      {
        q: "Resim kalitesi standartları",
        a: "Minimum 3 fotoğraf eklemeli, 1920x1080 çözünürlük önerilir. Araç ön, arka ve yan profilleri açıkça görünür olmalıdır.",
      },
      {
        q: "İlan onay süreci",
        a: "İlanlarınız moderasyon ekibimiz tarafından 24 saat içinde incelenir. Onaylandıktan sonra yayına alınır.",
      },
      {
        q: "Öne çıkarma özellikleri",
        a: "İlanlarınızı öne çıkarmak için 'Fiyatlandırma' bölümünden destekli ilan paketleri satın alabilirsiniz.",
      },
    ],
  },
  {
    icon: "ShieldAlert",
    iconColor: "text-rose-500",
    title: "GÜVENLİK & GİZLİLİK",
    items: [
      {
        q: "Şüpheli ilan bildirimi",
        a: "Güvenmediğiniz bir ilan gördüğünüzde 'Şikayet Et' butonu ile bildirebilirsiniz. Moderasyon ekibimiz en kısa sürede inceler.",
      },
      {
        q: "Güvenli ödeme rehberi",
        a: "Kapora göndermeden önce aracı görmeyi ve noter huzurunda işlem yapmayı öneriyoruz.",
      },
      {
        q: "Kişisel verilerin korunması",
        a: "Verileriniz GDPR ve KVKK kapsamında korunmaktadır. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.",
      },
      {
        q: "Hesap güvenliği",
        a: "Güçlü bir şifre kullanın, e-posta doğrulamanızı tamamlayın ve giriş bağlantılarınızı yalnızca resmi OtoBurada sayfalarından açın.",
      },
    ],
  },
  {
    icon: "FileText",
    iconColor: "text-primary",
    title: "TEKNİK KONULAR",
    items: [
      {
        q: "Şifremi unuttum",
        a: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısını kullanarak şifrenizi sıfırlayabilirsiniz.",
      },
      {
        q: "E-posta doğrulama",
        a: "Kayıt olduktan sonra e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktive edebilirsiniz.",
      },
      {
        q: "Mobil uygulama desteği",
        a: "OtoBurada'yı mobil tarayıcınızdan kullanabilir, cihazınıza 'Ana Ekle' seçeneğiyle kısayol oluşturabilirsiniz.",
      },
      {
        q: "Tarayıcı uyumluluğu",
        a: "Chrome, Firefox, Safari ve Edge'in güncel sürümlerini destekliyoruz.",
      },
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
    <div className="mx-auto max-w-5xl px-5 py-14 space-y-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Destek Merkezi</h1>
        <p className="text-muted-foreground font-medium text-lg">
          Sorularınız için aşağıdaki SSS bölümünü inceleyin veya bir destek talebi oluşturun.
        </p>
      </div>

      {user && userTickets.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Destek Taleplerim</h2>
          <TicketList tickets={userTickets} />
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Sık Sorulan Sorular</h2>
        <div className="space-y-4">
          {FAQ_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card">
              <div className="px-6 py-5 border-b border-border/50 flex items-center gap-3">
                <span className={`size-2 rounded-full ${cat.iconColor.replace("text-", "bg-")}`} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {cat.title}
                </h3>
              </div>
              <div className="divide-y divide-slate-50">
                {cat.items.map((item, i) => (
                  <FaqAccordion key={i} items={[item]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-6 space-y-2">
            <h2 className="text-xl font-bold text-foreground">Yeni Destek Talebi Oluştur</h2>
            <p className="text-sm text-muted-foreground">
              Teknik sorunlar, ilan moderasyonu veya hesap erişimiyle ilgili taleplerini bu formdan
              iletebilirsin.
            </p>
          </div>
          {user ? (
            <TicketForm />
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground font-medium">
              <p>
                Destek talebi oluşturmak ve mevcut taleplerini görmek için giriş yapman gerekiyor.
              </p>
              <Link
                href="/login?next=%2Fsupport"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Giriş yap ve destek talebi oluştur
              </Link>
              <p className="text-xs text-muted-foreground">
                Giriş yaptıktan sonra önceki sayfaya geri dönerek destek formunu kayıpsız şekilde
                tamamlayabilirsin.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
