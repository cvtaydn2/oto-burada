import Link from "next/link";
import { ArrowRight, ClipboardList, ShieldAlert, UserRoundCheck } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { getStoredReports } from "@/services/reports/report-submissions";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
});

const listingStatusLabels = {
  approved: "Yayinda",
  archived: "Arsivde",
  draft: "Taslak",
  pending: "Incelemede",
  rejected: "Reddedildi",
} as const;

function formatShortDate(value: string) {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return "Tarih bilinmiyor";
  }

  return dateFormatter.format(new Date(parsed));
}

export default async function DashboardPage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    full_name?: string;
    phone?: string;
  };
  const storedListings = await getStoredUserListings(user.id);
  const storedReports = (await getStoredReports()).filter((report) => report.reporterId === user.id);
  const approvedListingsCount = storedListings.filter((listing) => listing.status === "approved").length;
  const pendingListingsCount = storedListings.filter((listing) => listing.status === "pending").length;
  const profileCompletion = Math.round(
    ([metadata.full_name, metadata.phone, metadata.city].filter(Boolean).length / 3) * 100,
  );
  const recentActivity = [
    ...storedListings.map((listing) => ({
      description: `${listing.title} ilanı ${listingStatusLabels[listing.status].toLowerCase()} durumunda.`,
      id: listing.id,
      timestamp: listing.updatedAt,
      type: "listing" as const,
    })),
    ...storedReports.map((report) => ({
      description: "Bir ilan raporu incelemeye gonderildi.",
      id: report.id ?? `${report.listingId}-${report.createdAt}`,
      timestamp: report.updatedAt ?? report.createdAt,
      type: "report" as const,
    })),
  ]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          Genel Bakis
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {metadata.full_name ? `${metadata.full_name}, hos geldin` : "Paneline hos geldin"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Ilanlarini takip et, profil bilgilerini guncel tut ve moderasyon durumlarini tek
          ekrandan izle. Ilk hedefimiz hizli ve anlasilir bir satis akisi sunmak.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/listings"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ilanlarimi yonet
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/dashboard/profile"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Profili tamamla
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam ilan</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{storedListings.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {approvedListingsCount} tanesi yayinda veya onayli.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Moderasyon bekleyen</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{pendingListingsCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bekleyen ilanlar gerekli ise duzenlenebilir.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Gonderilen rapor</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{storedReports.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Yaptigin guvenlik bildirimleri burada sayilir.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Profil tamamlama</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">%{profileCompletion}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ad soyad, telefon ve sehir bilgileri baz alinir.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-1 size-5 text-primary" />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Son hareketler</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Ilanlarin ve rapor bildirimlerin icin en guncel durumlar.
              </p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
              Henuz hareket kaydi yok. Ilk ilani olusturdugunda veya bir ilan raporu
              gonderdiginde burada gorunecek.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.type === "listing" ? "Ilan hareketi" : "Guvenlik bildirimi"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {formatShortDate(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <UserRoundCheck className="mt-1 size-5 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Hizli yonlendirmeler</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Satici akisinda en sik kullanilan sayfalara hizli erisim.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/dashboard/listings"
                className="flex items-center justify-between rounded-[1.5rem] border border-border/70 bg-muted/20 px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Ilan olustur veya duzenle
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard/favorites"
                className="flex items-center justify-between rounded-[1.5rem] border border-border/70 bg-muted/20 px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Favori ilanlari incele
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex items-center justify-between rounded-[1.5rem] border border-border/70 bg-muted/20 px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Profil ve iletisim bilgisini guncelle
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 size-5 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Guven notu</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ilan olustururken net fotograf, dogru fiyat ve guncel iletisim bilgisi guven
                  donusumunu artirir.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
