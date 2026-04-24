export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type DopingType =
  | "small_photo"
  | "urgent"
  | "homepage_showcase"
  | "category_showcase"
  | "top_rank"
  | "detailed_search_showcase"
  | "bold_frame"
  | "bump";

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  uri: string;
}

export interface DopingPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  type: DopingType;
  features: string[];
}

export interface DopingPurchase {
  id: string;
  userId: string;
  listingId: string;
  packageId: string;
  paymentId?: string;
  status: "pending" | "active" | "expired";
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}
