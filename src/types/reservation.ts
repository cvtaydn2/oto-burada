export type ReservationStatus =
  | "pending_payment"
  | "active"
  | "completed"
  | "cancelled_by_buyer"
  | "cancelled_by_seller"
  | "expired";

export type ReservationEventType = "created" | "approved" | "cancelled" | "refunded" | "completed";

export interface Reservation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount_deposit: number;
  platform_fee: number;
  status: ReservationStatus;
  iyzico_payment_id: string | null;
  appointment_at: string | null;
  expires_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationEvent {
  id: string;
  reservation_id: string;
  actor_id: string | null;
  event_type: ReservationEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ReservationWithListing extends Reservation {
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number;
    photos: { public_url: string }[];
  };
}

export interface ReservationWithParties extends Reservation {
  buyer: {
    id: string;
    display_name: string;
    phone: string | null;
  };
  seller: {
    id: string;
    display_name: string;
    phone: string | null;
  };
}

export interface CreateReservationInput {
  listingId: string;
  amountDeposit: number;
  notes?: string;
}

export interface ConfirmReservationInput {
  reservationId: string;
  appointmentAt?: string;
}

export interface CancelReservationInput {
  reservationId: string;
  reason?: string;
}
