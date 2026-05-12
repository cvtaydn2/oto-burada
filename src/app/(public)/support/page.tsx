import { ArrowRight, BadgeCheck, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { FaqAccordion } from "@/components/shared/faq-accordion";
import { getCurrentUser } from "@/features/auth/lib/session";
import { TicketForm } from "@/features/support/components/ticket-form";
import { TicketList } from "@/features/support/components/ticket-list";
import { getUserTickets } from "@/features/support/services/support/ticket-actions";
import { logger } from "@/lib/logger";

const FAQ_CATEGORIES = [
  {
    icon: BadgeCheck,
    accentClassName: "bg-emerald-50 text-emerald-600",
    title: "İlan yönetimi",
    description: "İlan oluşturma, onay süreci ve görünürlük seçenekleri hakkında temel bilgiler.",
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
    icon: ShieldAlert,
    accentClassName: "bg-rose-50 text-rose-600",
    title: "Güvenlik ve gizlilik",
    description: "Güvenli alım-satım, hesap koruması ve şüpheli ilan bildirimleri için rehberler.",
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
    icon: FileText,
    accentClassName: "bg-primary/10 text-primary",
    title: "Teknik konular",
    description:
      "Şifre sıfırlama, e-posta doğrulama ve cihaz uyumluluğu ile ilgili sık sorulanlar.",
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
] as const;

export default async function SupportPage() {
  const user = await getCurrentUser();
  let userTickets: Awaited<ReturnType<typeof getUserTickets>> = [];
  if (user) {
    try {
      userTickets = await getUserTickets(user.id);
    } catch (error) {
      logger.auth.error("[SupportPage] Failed to load user tickets", error, {
        userId: user.id,
      });
      userTickets = [];
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="space-y-8 sm:space-y-10 lg:space-y-14">
        <section className="rounded-[2rem] border border-border/70 bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary">
                Destek merkezi
              </div>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Yardım ihtiyaçlarını tek yerde toplayan daha sade bir destek akışı.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Önce sık sorulan soruları inceleyin, ardından gerekiyorsa destek talebi oluşturun.
                  Bu yüzeyi mobilde daha rahat taranacak, daha az yoğun ve daha net bir bilgi
                  hiyerarşisiyle sunuyoruz.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <SupportSummaryCard
                title="Önce rehberleri kontrol edin"
                description="En sık karşılaşılan ilan, güvenlik ve teknik sorular için hazırlanmış özet cevaplar burada yer alır."
              />
              <SupportSummaryCard
                title="Gerekirse ticket oluşturun"
                description="Çözülemeyen durumlarda form üzerinden destek ekibine ayrıntılı talep iletebilirsiniz."
              />
              <SupportSummaryCard
                title="Hesabınızla devam edin"
                description="Giriş yaptığınızda açık taleplerinizi ve önceki destek geçmişinizi aynı ekranda takip edebilirsiniz."
              />
            </div>
          </div>
        </section>

        {user && userTickets.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Destek taleplerim
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Mevcut destek kayıtlarınızı buradan takip edebilirsiniz.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5 lg:p-6">
              <TicketList tickets={userTickets} />
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Sık sorulan sorular
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              En çok ihtiyaç duyulan üç başlığı daha okunabilir bloklar halinde grupladık.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {FAQ_CATEGORIES.map((category) => {
              const Icon = category.icon;

              return (
                <div
                  key={category.title}
                  className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm"
                >
                  <div className="border-b border-border/70 px-4 py-4 sm:px-5">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${category.accentClassName}`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                      {category.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <div className="divide-y divide-border/60">
                    {category.items.map((item) => (
                      <FaqAccordion key={item.q} items={[item]} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Yeni destek talebi oluştur
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Teknik sorunlar, ilan moderasyonu veya hesap erişimiyle ilgili taleplerinizi bu
                alandan iletebilirsiniz.
              </p>
            </div>

            <div className="mt-6">
              {user ? (
                <TicketForm />
              ) : (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Destek talebi oluşturmak ve mevcut taleplerinizi görmek için giriş yapmanız
                    gerekir. Girişten sonra yeniden destek merkezine dönebilirsiniz.
                  </p>
                  <Link
                    href="/login?next=%2Fsupport"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Giriş yap ve destek talebi oluştur
                  </Link>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Kısa sorular için iletişim sayfasındaki WhatsApp ve e-posta kanallarını da
                    kullanabilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-muted/20 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Öncelikli güvenlik bildirimleri
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Şüpheli ilan, hesap güvenliği veya dolandırıcılık şüphesi gibi konuları gecikmeden
                destek ekibine iletmeniz önerilir.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background/90 p-4">
              <p className="text-sm font-medium text-foreground">Hızlı yönlendirme</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>• Şüpheli içerikler için önce ilan üzerindeki bildirim akışını kullanın.</p>
                <p>
                  • Hesap erişimi sorunlarında e-posta doğrulama ve şifre yenileme rehberlerine
                  bakın.
                </p>
                <p>
                  • Ayrıntılı destek gerektiğinde ticket oluşturarak daha fazla bağlam paylaşın.
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
            >
              İletişim kanallarını görüntüle
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function SupportSummaryCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
