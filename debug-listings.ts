import { getFilteredDatabaseListings } from "./src/services/listings/listing-submissions";
import { config } from "dotenv";

config({ path: ".env.local" });

async function debugListings() {
  console.log("Fetching listings to debug...");
  try {
    const result = await getFilteredDatabaseListings({ page: 1, limit: 12 });
    console.log("SUCCESS - Listings found:", result.listings.length);
    console.log("Total Count:", result.total);
    if (result.listings.length === 0) {
        console.log("WARNING: Result set is empty but count is not 0 (if > 0).");
    }
  } catch (err) {
    console.error("CRITICAL ERROR during fetching:", err);
  }
}

debugListings();
