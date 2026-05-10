"use server";

import {
  getStoredListingById,
  getStoredUserListings,
} from "@/features/marketplace/services/queries/get-listings";
import { getStoredProfileById } from "@/features/profile/services/profile-records";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";
import type { Listing } from "@/types";

import type {
  DashboardEditableListing,
  DashboardEditState,
  DashboardListingsPageData,
  DashboardListingSummary,
} from "../types/dashboard-listings";

interface GetDashboardListingsPageDataParams {
  userId: string;
  page: number;
  pageSize: number;
  editId?: string | null;
}

function toDashboardListingSummary(listing: Listing): DashboardListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    city: listing.city,
    status: listing.status,
    updatedAt: listing.updatedAt ?? null,
    publishedAt: listing.createdAt ?? null,
    version: listing.version,
  };
}

function toDashboardEditableListing(listing: Listing): DashboardEditableListing {
  return {
    id: listing.id,
    version: listing.version,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    price: listing.price,
    city: listing.city,
    district: listing.district,
    whatsappPhone: listing.whatsappPhone,
    description: listing.description,
    vin: listing.vin ?? null,
    status: listing.status,
  };
}

async function resolveEditingState(
  userId: string,
  editId?: string | null
): Promise<DashboardEditState> {
  if (!editId) {
    return { status: "idle" };
  }

  const listing = await getStoredListingById(editId);

  if (!listing) {
    return { status: "not_found" };
  }

  if (listing.sellerId !== userId) {
    return { status: "forbidden" };
  }

  return {
    status: "loaded",
    listing: toDashboardEditableListing(listing),
  };
}

function normalizeTotalCount(result: {
  listings?: Listing[];
  totalCount?: number | null;
  count?: number | null;
}) {
  if (typeof result.totalCount === "number") {
    return result.totalCount;
  }

  if (typeof result.count === "number") {
    return result.count;
  }

  return Array.isArray(result.listings) ? result.listings.length : 0;
}

export async function getDashboardListingsPageData({
  userId,
  page,
  pageSize,
  editId = null,
}: GetDashboardListingsPageDataParams): Promise<DashboardListingsPageData> {
  const [listingsResult, references, profile, editing] = await Promise.all([
    getStoredUserListings(userId, page, pageSize),
    getLiveMarketplaceReferenceData(),
    getStoredProfileById(userId),
    resolveEditingState(userId, editId),
  ]);

  const listings = Array.isArray(listingsResult.listings) ? listingsResult.listings : [];

  return {
    listingsPage: {
      page,
      pageSize,
      totalCount: normalizeTotalCount(listingsResult),
      items: listings.map(toDashboardListingSummary),
    },
    editing,
    references: {
      brands: references.brands,
      cities: references.cities,
    },
    profile: profile
      ? {
          city: profile.city ?? null,
          phone: profile.phone ?? null,
          emailVerified: profile.emailVerified ?? false,
        }
      : null,
  };
}
