import { AlertCircle } from "lucide-react";
import Link from "next/link";

export function ListingInactiveState() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle className="size-10 text-amber-600" />
      </div>
      <h1
        className="mb-2 text-2xl font-bold text-foreground"
        data-testid="listing-inactive-heading"
      >
        İlan Aktif Değil
      </h1>
      <p
        className="mb-8 max-w-md text-muted-foreground italic"
        data-testid="listing-inactive-message"
      >
        Bu ilan henüz onaylanmamış, reddedilmiş veya yayından kaldırılmış olabilir.
      </p>
      <Link
        href="/listings"
        className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90 transition"
      >
        Piyasadaki Diğer İlanlar
      </Link>
    </div>
  );
}
