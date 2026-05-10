import {
  ArrowRight,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/shared/contact-form";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { FEATURES } from "@/lib/features";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "İletişim | OtoBurada",
  description: "OtoBurada ile iletişime geçin. Soru, öneri veya işbirliği için ekibimize ulaşın.",
  alternates: {
    canonical: buildAbsoluteUrl("/contact"),
  },
};

const CONTACT_CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "En hızlı geri dönüş için ekibimize doğrudan mesaj bırakın.",
    value: "+90 (212) 000 00 00",
    accentClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Mail,
    title: "E-posta",
    description: "Detaylı destek talepleri ve iş birlikleri için bize yazın.",
    value: "destek@otoburada.com",
    accentClassName: "bg-slate-100 text-slate-700",
  },
  {
    icon: Phone,
    title: "Destek saatleri",
    description: "Hafta içi 09:00 - 18:00 arasında destek ekibimiz aktiftir.",
    value: "Hafta içi 09:00 - 18:00",
    accentClassName: "bg-blue-50 text-blue-600",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "İlan vermek ücretli mi?",
    answer:
      "Hayır, OtoBurada üzerinde bireysel ilan vermek ücretsizdir. Kurumsal planlar ve görünürlük artıran ek hizmetler ayrıca sunulur.",
  },
  {
    question: "İlanım ne zaman onaylanır?",
    answer:
      "Moderasyon ekibimiz ilanları genellikle kısa süre içinde inceler. Mesai dışındaki başvurular ilk uygun zaman diliminde değerlendirilir.",
  },
  {
    question: "Ekspertiz zorunlu mu?",
    answer:
      "Zorunlu değildir. Ancak ekspertiz raporu eklenen ilanlar, alıcıların daha hızlı güven oluşturmasına yardımcı olur.",
  },
  {
    question: "Şüpheli ilanı nasıl bildirebilirim?",
    answer:
      "İlan detay sayfasındaki şikayet akışını kullanabilir veya destek ekibine ulaşabilirsiniz. Bildirimler moderasyon tarafından incelenir.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="space-y-8 sm:space-y-10 lg:space-y-14">
        <section className="rounded-[2rem] border border-border/70 bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-4 sm:space-y-5">
              <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary">
                İletişim
              </div>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Sorular, öneriler ve destek talepleri için doğru kanala hızlıca ulaşın.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  OtoBurada’da iletişim deneyimini de marketplace yüzeyleri kadar sade tutuyoruz.
                  İhtiyacınıza göre WhatsApp, e-posta veya destek formu üzerinden bize
                  ulaşabilirsiniz.
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-muted/25 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {CONTACT_CHANNELS.map((channel) => (
                  <ContactCard key={channel.title} {...channel} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-slate-950 text-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)]">
            <div className="relative h-full px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
              <div className="absolute right-0 top-0 h-48 w-48 -translate-y-10 translate-x-12 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative z-10 flex h-full flex-col gap-6">
                <div className="space-y-3">
                  <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">İletişim bilgileri</h2>
                    <p className="text-sm leading-6 text-slate-200">
                      Resmi başvurular, güvenlik bildirimleri veya genel destek talepleri için
                      aşağıdaki kanalları kullanabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoRow
                    icon={<MapPin className="size-4.5" />}
                    title="Genel merkez"
                    detail={
                      <>
                        Levent Mah. Çayır Çimen Sk. No:1
                        <br />
                        Beşiktaş, İstanbul
                      </>
                    }
                  />
                  <InfoRow
                    icon={<Phone className="size-4.5" />}
                    title="Müşteri desteği"
                    detail={
                      <>
                        +90 (212) 000 00 00
                        <br />
                        <span className="text-slate-300">Hafta içi 09:00 - 18:00</span>
                      </>
                    }
                  />
                  <InfoRow
                    icon={<Mail className="size-4.5" />}
                    title="E-posta"
                    detail="destek@otoburada.com"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Öncelikli konu güvenlik mi?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Şüpheli ilan, kötüye kullanım veya güven sorunlarında destek merkezine yönelerek
                    daha ayrıntılı rehberleri inceleyebilirsiniz.
                  </p>
                  <Link
                    href="/support"
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                  >
                    Destek merkezine git
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {FEATURES.TICKETS ? "Mesaj gönderin" : "Bize ulaşın"}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Destek formunu kullanarak mesajınızı iletebilir, kısa sorular için doğrudan WhatsApp
                veya e-posta kanalını tercih edebilirsiniz.
              </p>
            </div>

            <div className="mt-6">
              {FEATURES.TICKETS ? (
                <ContactForm />
              ) : (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Şu anda form üzerinden ticket açma özelliği aktif değil. Yine de destek
                    ekibimize hızlı şekilde ulaşmak için mevcut iletişim kanallarını
                    kullanabilirsiniz.
                  </p>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    WhatsApp: +90 (212) 000 00 00
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
                    E-posta: destek@otoburada.com
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:gap-6">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                <HelpCircle className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Sıkça sorulan sorular
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  İletişime geçmeden önce en sık karşılaşılan başlıkları buradan gözden
                  geçirebilirsiniz.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-muted/20 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Güvenlik ve güven bildirimi
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Güvenli alışveriş rehberi, şüpheli ilan bildirme akışı ve hesap güvenliği notları
                için destek merkezi sayfasındaki rehberleri kullanabilirsiniz.
              </p>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-border/70 bg-background/90 p-4">
              <p className="text-sm font-medium text-foreground">
                Ne zaman destek merkezine gitmeliyim?
              </p>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                <li>Şüpheli ilan veya kullanıcı davranışı gördüğünüzde,</li>
                <li>Hesap erişimi ve doğrulama konusunda yardıma ihtiyaç duyduğunuzda,</li>
                <li>
                  İlan moderasyonu veya teknik bir sorun hakkında ayrıntılı rehber aradığınızda.
                </li>
              </ul>
            </div>

            <Link
              href="/support"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
            >
              Destek merkezini aç
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  description,
  value,
  accentClassName,
}: {
  icon: typeof MessageCircle;
  title: string;
  description: string;
  value: string;
  accentClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
      <div className={`flex size-10 items-center justify-center rounded-xl ${accentClassName}`}>
        <Icon className="size-4.5" />
      </div>
      <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <div className="text-sm leading-6 text-slate-200">{detail}</div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4 sm:px-5">
      <h4 className="text-sm font-semibold text-foreground">{question}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
    </div>
  );
}
