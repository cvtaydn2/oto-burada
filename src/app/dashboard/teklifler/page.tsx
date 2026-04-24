import Link from "next/link";

import { OfferStatusBadge } from "@/components/offers/offer-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils";
import { getOffersForUser, getOffersReceived } from "@/services/offers/offer-service";

export default async function OffersDashboardPage() {
  const user = await requireUser();

  const [myOffers, receivedOffers] = await Promise.all([
    getOffersForUser(user.id),
    getOffersReceived(user.id),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-4 py-6 sm:py-8 lg:px-10 lg:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Teklifler</h1>
          <p className="text-muted-foreground text-sm">Verdiğiniz ve aldığınız teklifler</p>
        </div>
      </div>

      {/* Received Offers */}
      <section>
        <h2 className="text-lg font-bold mb-4">Aldığım Teklifler ({receivedOffers.length})</h2>
        {receivedOffers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Henüz teklif almadınız.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {receivedOffers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${offer.listing?.slug ?? offer.listing_id}`}
                        className="font-medium truncate hover:text-primary"
                      >
                        {offer.listing?.title ?? "İlan"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Teklif: {formatPrice(offer.offered_price)} TL
                        {offer.message && ` • ${offer.message}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <OfferStatusBadge status={offer.status} />
                      <form action="/api/offers/reject" method="POST">
                        <input type="hidden" name="offerId" value={offer.id} />
                        <Button size="sm" variant="outline">
                          Reddet
                        </Button>
                      </form>
                      <form action="/api/offers/accept" method="POST">
                        <input type="hidden" name="offerId" value={offer.id} />
                        <Button size="sm">Kabul Et</Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* My Offers */}
      <section>
        <h2 className="text-lg font-bold mb-4">Verdiğim Teklifler ({myOffers.length})</h2>
        {myOffers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Henüz teklif vermediniz.
              <Link href="/listings" className="ml-2 text-primary hover:underline">
                İlanları incele
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myOffers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${offer.listing?.slug ?? offer.listing_id}`}
                        className="font-medium truncate hover:text-primary"
                      >
                        {offer.listing?.title ?? "İlan"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Teklif: {formatPrice(offer.offered_price)} TL
                        {offer.message && ` • ${offer.message}`}
                      </p>
                    </div>
                    <OfferStatusBadge status={offer.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
