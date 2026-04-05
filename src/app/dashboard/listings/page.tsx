import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { MyListingsPanel } from "@/components/listings/my-listings-panel";
import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";

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
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Ilan Yonetimi</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          Ilanlarini olustur, takip et ve gerekirse guncelle
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Bu alan sadece sana ait araba ilanlarini gosterir. Bekleyen ilanlari duzenleyebilir,
          artik yayinlamak istemediklerini arsive alabilirsin.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Toplam ilan</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{storedListings.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Incelemede</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{pendingListingsCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Arsivde</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{archivedListingsCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Varsayilan WhatsApp</p>
            <p className="mt-2 text-lg font-semibold tracking-tight">
              {metadata.phone ?? "Profilinden ekleyebilirsin"}
            </p>
          </div>
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
