import { NextResponse } from "next/server";

import { getListingPriceHistory } from "@/services/listings/listing-price-history";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const history = await getListingPriceHistory(id);
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
