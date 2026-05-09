export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offered_price: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "counter_offer" | "expired" | "completed";
  counter_price: number | null;
  counter_message: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string;
    title: string;
    slug: string;
    price: number;
    city: string;
    images: string[];
    seller_id?: string;
  };
  buyer?: {
    full_name: string;
    phone: string;
  };
}

export function isUserOfferOwner(listingSellerId: string, userId: string): boolean {
  return listingSellerId === userId;
}

export function validateOfferCreation(params: {
  listing: { seller_id: string; status: string } | null;
  userId: string;
  offeredPrice: number;
}) {
  if (!params.listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (params.listing.status !== "approved") {
    throw new Error("Sadece onaylı ilanlara teklif verebilirsiniz.");
  }

  if (params.listing.seller_id === params.userId) {
    throw new Error("Kendi ilanınıza teklif veremezsiniz.");
  }

  if (params.offeredPrice <= 0) {
    throw new Error("Teklif fiyatı sıfırdan büyük olmalıdır.");
  }
}

export function validateOfferResponse(params: {
  offer: { buyer_id: string; status: string; expires_at: string | null } | null;
  listingSellerId: string;
  userId: string;
  response: "accepted" | "rejected" | "counter_offer";
  counterPrice?: number;
}) {
  if (!params.offer) {
    throw new Error("Teklif bulunamadı.");
  }

  if (!["pending", "counter_offer"].includes(params.offer.status)) {
    throw new Error("Bu teklif zaten yanıtlandı.");
  }

  if (params.offer.expires_at && new Date(params.offer.expires_at) < new Date()) {
    throw new Error("Bu teklifin süresi dolmuş.");
  }

  const isSeller = params.listingSellerId === params.userId;
  const isBuyer = params.offer.buyer_id === params.userId;

  if (params.offer.status === "pending" && !isSeller) {
    throw new Error("Sadece satıcı bekleyen tekliflere yanıt verebilir.");
  }

  if (params.offer.status === "counter_offer" && !isBuyer) {
    throw new Error("Sadece alıcı karşı tekliflere yanıt verebilir.");
  }

  if (!isSeller && !isBuyer) {
    throw new Error("Bu teklifi yanıtlama yetkiniz yok.");
  }

  if (params.response === "counter_offer") {
    if (!params.counterPrice || params.counterPrice <= 0) {
      throw new Error("Karşı teklif için geçerli bir fiyat girin.");
    }
  }
}
