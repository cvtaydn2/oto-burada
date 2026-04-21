import { Listing } from "@/types";

/** DB row shape for a listing image — used internally for mapping. */
export interface ListingImageRow {
  id: string;
  is_cover: boolean;
  listing_id: string;
  public_url: string;
  sort_order: number;
  storage_path: string;
  placeholder_blur: string | null;
}

/** DB row shape for a listing — used internally for mapping. */
export interface ListingRow {
  brand: string;
  city: string;
  created_at: string;
  damage_status_json?: Record<string, unknown> | null;
  description: string;
  district: string;
  expert_inspection?: Listing["expertInspection"] | null;
  featured: boolean;
  featured_until?: string | null;
  urgent_until?: string | null;
  highlighted_until?: string | null;
  fraud_reason?: string | null;
  fraud_score?: number | null;
  fuel_type: Listing["fuelType"];
  id: string;
  license_plate?: string | null;
  listing_images?: ListingImageRow[] | null;
  profiles?: {
    id: string;
    full_name: string;
    phone: string | null;
    city: string;
    avatar_url: string | null;
    role: string;
    user_type: string;
    business_name: string | null;
    business_logo_url: string | null;
    is_verified: boolean;
    is_banned: boolean;
    ban_reason: string | null;
    verified_business: boolean;
    business_slug: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  mileage: number;
  model: string;
  price: number;
  published_at?: string | null;
  view_count?: number;
  seller_id: string;
  slug: string;
  status: Listing["status"];
  title: string;
  tramer_amount?: number | null;
  transmission: Listing["transmission"];
  updated_at: string;
  version?: number;
  bumped_at?: string | null;
  market_price_index?: number | null;
  whatsapp_phone: string;
  year: number;
  vin?: string | null;
  car_trim?: string | null;
}
