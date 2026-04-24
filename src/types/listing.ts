import type { ExpertInspection, FuelType, ListingStatus, TransmissionType } from "./domain";
import type { Profile } from "./profile";

export interface ListingImage {
  id?: string;
  listingId?: string | null;
  storagePath: string;
  url: string;
  order: number;
  isCover: boolean;
  placeholderBlur?: string | null;
  type?: "photo" | "video" | "360";
  thumbnailUrl?: string | null;
}

export interface ListingCore {
  id: string;
  slug: string;
  sellerId: string;
  title: string;
  brand: string;
  model: string;
  carTrim?: string | null;
  year: number;
  price: number;
  status: ListingStatus;
}

export interface ListingDetails {
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
}

export interface ListingTrustAndPricing {
  vin?: string | null;
  licensePlate?: string | null;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
  fraudScore?: number;
  fraudReason?: string | null;
  marketPriceIndex?: number | null;
  expertInspection?: ExpertInspection;
  version: number;
}

export interface ListingBadges {
  featured: boolean;
  featuredUntil?: string | null;
  urgentUntil?: string | null;
  highlightedUntil?: string | null;
}

export interface Listing
  extends ListingCore, ListingDetails, ListingTrustAndPricing, ListingBadges {
  images: ListingImage[];
  seller?: Partial<Profile>;
  bumpedAt?: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingCreateInput {
  title: string;
  brand: string;
  model: string;
  carTrim?: string | null;
  year: number;
  price: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  vin: string;
  licensePlate?: string | null;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
  images: ListingImage[];
  expertInspection?: ExpertInspection;
}

export interface ListingCreateFormImage {
  fileName?: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  url?: string;
  placeholderBlur?: string | null;
  imageType?: "photo" | "360";
}

export interface ListingCreateFormValues extends Omit<ListingCreateInput, "images"> {
  images: ListingCreateFormImage[];
}
