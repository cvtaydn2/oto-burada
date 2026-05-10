export interface PublicListingSeller {
  id: string;
  display_name: string | null;
  is_corporate: boolean;
  phone_visibility: "public" | "masked" | "hidden" | null;
}

export interface PublicListingMediaItem {
  id: string;
  storage_path: string;
  public_url: string;
  blurhash: string | null;
  is_cover: boolean;
  sort_order: number;
}

export interface PublicListingContact {
  whatsapp_number: string | null;
  phone_visibility: "public" | "masked" | "hidden" | null;
}

export interface PublicListingDetail {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  city: string | null;
  district: string | null;
  year: number | null;
  km: number | null;
  fuel_type: string | null;
  transmission: string | null;
  description: string | null;
  seller: PublicListingSeller;
  media: PublicListingMediaItem[];
  contact: PublicListingContact;
}
