import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { MyListingsPanel } from "@/components/listings/my-listings-panel";
import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { CheckCircle2, ClipboardList, MessageCircle, Package } from "lucide-react";

interface DashboardListingsPageProps {
  searchParams?: Promise<{
    edit?: string;
  }>;
}

export default async function DashboardListingsPage({ searchParams }: DashboardListingsPageProps) {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    phone?: string;
  };
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const hasRequestedEditListing = Boolean(resolvedSearchParams?.edit);
  const storedListings = await getStoredUserListings(user.id);
  const selectedListing = resolvedSearchParams?.edit
    ? storedListings.find(
        (listing) =>
          listing.id === resolvedSearchParams.edit &&
          (listing.status === "draft" || listing.status === "pending"),
      ) ?? null
    : null;
  const pendingListingsCount = storedListings.filter((listing) => listing.status === "pending").length;
  const archivedListingsCount = storedListings.filter((listing) => listing.status === "archived").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
              Ilan Yonetimi
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Ilanlarini olustur, takip et ve gerekirse guncelle
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Bu alan sadece sana ait araba ilanlarini gosterir. Bekleyen ilanlari
              duzenleyebilir, artik yayinlamak istemediklerini arsive alabilirsin.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MessageCircle className="size-4" />
              Hazir iletisim bilgisi
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Formda varsayilan olarak kullanilacak WhatsApp numaran:
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-foreground">
              {metadata.phone ?? "Profilinden ekleyebilirsin"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <DashboardMetricCard
            label="Toplam ilan"
            value={String(storedListings.length)}
            helper="Tum taslak, incelemede ve arsivdeki ilanlar dahil."
            icon={ClipboardList}
            tone="indigo"
          />
          <DashboardMetricCard
            label="Incelemede"
            value={String(pendingListingsCount)}
            helper="Moderasyon sirasi bekleyen ilanlar."
            icon={Package}
            tone="amber"
          />
          <DashboardMetricCard
            label="Arsivde"
            value={String(archivedListingsCount)}
            helper="Yayinda tutmak istemedigin ilanlar."
            icon={CheckCircle2}
            tone="slate"
          />
          <DashboardMetricCard
            label="WhatsApp hazir"
            value={metadata.phone ? "Hazir" : "Eksik"}
            helper={metadata.phone ?? "Profil ekranindan ekleyebilirsin."}
            icon={MessageCircle}
            tone={metadata.phone ? "emerald" : "amber"}
          />
        </div>
      </section>

      <MyListingsPanel activeEditId={selectedListing?.id} listings={storedListings} />

      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          {selectedListing ? "Ilan Duzenle" : "Yeni Ilan"}
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">
          {selectedListing
            ? "Bekleyen veya taslak ilani guncelle"
            : "Arabanı birkaç adımda yayına gönder"}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {selectedListing
            ? "Formu guncellediginde ilan tekrar ayni durumuyla kaydedilir ve son degisiklik zamani yenilenir."
            : "Form sadece araba ilanlari icindir. Bilgileri net girdikce moderasyon sureci hizlanir ve alici guveni artar."}
        </p>

        {hasRequestedEditListing && !selectedListing ? (
          <div className="mt-6 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
            Duzenlemek istedigin ilan bulunamadi ya da artik duzenlenebilir durumda degil. Asagida
            yeni ilan formu acildi; mevcut ilanlarindan gecerli olanlari listeden tekrar
            secebilirsin.
          </div>
        ) : null}

        <div className="mt-6">
          <ListingCreateForm
            key={selectedListing?.id ?? "create-listing"}
            initialListing={selectedListing}
            initialValues={{
              city: metadata.city ?? "",
              whatsappPhone: metadata.phone ?? "",
            }}
          />
        </div>
      </section>
    </div>
  );
}
