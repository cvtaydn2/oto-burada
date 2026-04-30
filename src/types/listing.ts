import type {
  ExpertInspection,
  FuelType,
  ListingStatus,
  TransmissionType,
  VehicleCategory,
} from "./domain";
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
  category: VehicleCategory;
  carTrim?: string | null;
  year: number;
  /**
   * BUG-L01 Resolution:
   * Postgres uses `bigint` for price, but we map it to `number` in TS.
   * Number.MAX_SAFE_INTEGER is ~9 quadrillion, safely covering max car prices in TL.
   */
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
  // Doping-specific flags (set by activate_doping RPC)
  isFeatured?: boolean | null;
  isUrgent?: boolean | null;
  frameColor?: string | null;
  galleryPriority?: number | null;
  smallPhotoUntil?: string | null;
  homepageShowcaseUntil?: string | null;
  categoryShowcaseUntil?: string | null;
  topRankUntil?: string | null;
  detailedSearchShowcaseUntil?: string | null;
  boldFrameUntil?: string | null;
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
  category?: VehicleCategory;
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
  turnstileToken?: string;
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

export interface ListingQuestion {
  id: string;
  listing_id: string;
  user_id: string;
  question: string;
  answer?: string | null;
  status: "pending" | "approved" | "rejected";
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
