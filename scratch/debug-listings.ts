import * as dotenv from "dotenv";

import { getFilteredMarketplaceListings } from "../src/services/listings/marketplace-listings";

dotenv.config({ path: ".env.local" });

async function debug() {
  try {
    console.log("Fetching listings...");
    const result = await getFilteredMarketplaceListings({ page: 1, limit: 12 });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Caught Error:", error);
  }
}

debug();
