import { refreshTopMarketSegments } from "../features/marketplace/services/market/market-stats";

async function main() {
  console.log("Refreshing market segments...");
  try {
    await refreshTopMarketSegments();
    console.log("Market segments refreshed successfully!");
  } catch (error) {
    console.error("Error refreshing market segments:", error);
    process.exit(1);
  }
}

main();
