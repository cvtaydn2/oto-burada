import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getPublicListings } from "@/features/marketplace/services/listings/catalog";
import type { PaginatedListingsResult } from "@/features/marketplace/services/listings/listing-query-types";
import { listingFiltersSchema } from "@/lib/validators/marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filtersRaw = Object.fromEntries(searchParams.entries());

    const filters = listingFiltersSchema.parse(filtersRaw);

    const result: PaginatedListingsResult = await getPublicListings(filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid filters", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Marketplace listings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
