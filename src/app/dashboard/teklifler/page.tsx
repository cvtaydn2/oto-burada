import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/features/auth/lib/session";
import { OfferActions } from "@/features/offers/components/offer-actions";
import { OfferStatusBadge } from "@/features/offers/components/offer-status-badge";
import {
  getOffersForUser,
  getOffersReceived,
} from "@/features/offers/services/offers/offer-actions";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function OffersDashboardPage() {
  const user = await requireUser();

  const [myOffers, receivedOffers] = await Promise.all([
    getOffersForUser(user.id),
    getOffersReceived(user.id),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-4 py-6 sm:py-8 lg:px-10 lg:py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Teklifler</h1>
        <p className="text-muted-foreground text-sm">Verdiğiniz ve aldığınız teklifler</p>
      </div>

      {/* Received Offers */}
      <section>
        <h2 className="text-lg font-bold mb-4">
          Aldığım Teklifler{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({receivedOffers.length})
          </span>
        </h2>
        {receivedOffers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Henüz teklif almadınız.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {receivedOffers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        href={`/listing/${offer.listing?.slug ?? offer.listing_id}`}
                        className="font-semibold text-sm hover:text-primary transition-colors truncate block"
                      >
                        {offer.listing?.title ?? "İlan"}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Teklif:{" "}
                          <span className="font-bold text-foreground">
                            {formatPrice(offer.offered_price)} TL
                          </span>
                        </span>
                        {offer.listing?.price && (
                          <span className="text-xs">
                            (İlan: {formatPrice(offer.listing.price)} TL)
                          </span>
                        )}
                      </div>
                      {offer.message && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          &ldquo;{offer.message}&rdquo;
                        </p>
                      )}
                      {/* Counter offer info */}
                      {offer.status === "counter_offer" && offer.counter_price && (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
                          <span className="font-bold">Karşı Teklif:</span>{" "}
                          {formatPrice(offer.counter_price)} TL
                          {offer.counter_message && ` — ${offer.counter_message}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <OfferStatusBadge status={offer.status} />
                      {offer.status === "pending" && (
                        <OfferActions
                          offerId={offer.id}
                          view="seller"
                          offeredPrice={offer.offered_price}
                        />
                      )}
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
        <h2 className="text-lg font-bold mb-4">
          Verdiğim Teklifler{" "}
          <span className="text-sm font-normal text-muted-foreground">({myOffers.length})</span>
        </h2>
        {myOffers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Henüz teklif vermediniz.{" "}
              <Link href="/listings" className="text-primary hover:underline">
                İlanları incele
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myOffers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        href={`/listing/${offer.listing?.slug ?? offer.listing_id}`}
                        className="font-semibold text-sm hover:text-primary transition-colors truncate block"
                      >
                        {offer.listing?.title ?? "İlan"}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Teklifiniz:{" "}
                          <span className="font-bold text-foreground">
                            {formatPrice(offer.offered_price)} TL
                          </span>
                        </span>
                        {offer.listing?.price && (
                          <span className="text-xs">
                            (İlan: {formatPrice(offer.listing.price)} TL)
                          </span>
                        )}
                      </div>
                      {offer.message && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          &ldquo;{offer.message}&rdquo;
                        </p>
                      )}
                      {/* Counter offer received */}
                      {offer.status === "counter_offer" && offer.counter_price && (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
                          <span className="font-bold">Satıcı Karşı Teklif Yaptı:</span>{" "}
                          {formatPrice(offer.counter_price)} TL
                          {offer.counter_message && ` — ${offer.counter_message}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <OfferStatusBadge status={offer.status} />
                      {/* Buyer can accept/reject counter offer */}
                      {offer.status === "counter_offer" && (
                        <OfferActions
                          offerId={offer.id}
                          view="buyer"
                          offeredPrice={offer.counter_price || undefined}
                        />
                      )}
                    </div>
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
