import { runSwarmOrchestration } from "../scripts/copilot/orchestrator.mjs";

async function main() {
  const files = [
    "src/app/(public)/(marketplace)/listing/[slug]/page.tsx",
    "src/features/marketplace/components/listing-gallery.tsx",
    "src/features/marketplace/components/listing-detail/listing-price-box.tsx",
    "src/features/marketplace/components/listing-detail/listing-info-card.tsx",
    "src/features/marketplace/components/contact-actions.tsx"
  ];
  
  const prompt = "Perform an advanced architectural, UX, and stability audit of the Listing Detail feature set. Analyze the hydration flow in page.tsx, interaction handling in listing-gallery, price and sticky action states, and contact reveal reliability. Identify component size, duplicate data fetch, or redundant client logic violations according to the project constitution.";
  
  console.log("🚀 Starting Copilot Swarm Orchestration for Phase 2: Listing Detail...");
  try {
    await runSwarmOrchestration(files, prompt);
    console.log("✅ Analysis Complete! Results cached in scratch/copilot-solution.md");
  } catch (error) {
    console.error("❌ Execution failed:", error);
  }
}

main();
