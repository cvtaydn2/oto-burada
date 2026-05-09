import { runSwarmOrchestration } from "../scripts/copilot/orchestrator.mjs";
import { activeContextFiles } from "../scripts/copilot/config.mjs";

// Focus on reports system
activeContextFiles.add("src/features/reports/services/reports/report-submissions.ts");

console.log("Starting Swarm Analysis of Reports Feature...");
runSwarmOrchestration("Perform architectural splitting of `src/features/reports/services/reports/report-submissions.ts` into canonical layers (*-records.ts for DB, *-logic.ts for business logic, *-actions.ts for entry points). Ensure strict validation schemas using Zod and maintain backward compatibility via original filename facade.")
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
