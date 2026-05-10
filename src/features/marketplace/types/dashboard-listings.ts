import type { BrandCatalogItem, CityOption, Listing } from "@/types";

export type DashboardListingStatus = Listing["status"];

export interface DashboardListingSummary {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  status: DashboardListingStatus;
  updatedAt: string | null;
  publishedAt: string | null;
  version: number;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
  expertInspection?: {
    hasInspection: boolean;
    inspectionDate?: string;
  } | null;
}

export interface DashboardEditableListing {
  id: string;
  version: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  price: number;
  city: string;
  district: string;
  whatsappPhone: string;
  description: string;
  vin?: string | null;
  status: DashboardListingStatus;
}

export type DashboardEditState =
  | { status: "idle" }
  | { status: "loaded"; listing: DashboardEditableListing }
  | { status: "not_found" }
  | { status: "forbidden" };

export interface DashboardListingsPageData {
  listingsPage: {
    page: number;
    pageSize: number;
    totalCount: number;
    items: DashboardListingSummary[];
  };
  editing: DashboardEditState;
  references: {
    brands: BrandCatalogItem[];
    cities: CityOption[];
  };
  profile: {
    city: string | null;
    phone: string | null;
    emailVerified: boolean;
  } | null;
}
