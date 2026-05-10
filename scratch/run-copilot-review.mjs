import { activeContextFiles } from "../scripts/copilot/config.mjs";
import { runSwarmOrchestration } from "../scripts/copilot/orchestrator.mjs";
import process from "node:process";

async function main() {
  const files = [
    "src/app/(public)/(marketplace)/page.tsx",
    "src/components/layout/home-hero.tsx",
    "src/features/marketplace/components/featured-carousel.tsx",
    "src/components/shared/listing-card.tsx"
  ];

  files.forEach(f => activeContextFiles.add(f));
  console.log(`Loaded ${activeContextFiles.size} files into memory.`);

  const prompt = `Review currently loaded files for UI consistency, UX polish, mobile responsiveness, performance issues, and adherence to AGENTS.md constitutional mandates. 
DO NOT GENERATE NEW CODE FILES OR <write_file> TAGS. 
OUTPUT ONLY A STRUCTURED MARKDOWN REPORT containing exact problems identified and their suggested implementation paths.`;

  await runSwarmOrchestration(prompt);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
