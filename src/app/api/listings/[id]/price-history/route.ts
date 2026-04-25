import { NextResponse } from "next/server";
import { z } from "zod";

import { getListingPriceHistory } from "@/services/listings/listing-price-history";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    z.string().uuid().parse(id); // Validate UUID
    const history = await getListingPriceHistory(id);
    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
