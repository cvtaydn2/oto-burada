import { runSwarmOrchestration } from "../scripts/copilot/orchestrator.mjs";
import { activeContextFiles } from "../scripts/copilot/config.mjs";

// Focus on exchange system
activeContextFiles.add("src/features/exchange/services/exchange/exchange-offers.ts");
activeContextFiles.add("AGENTS.md");

console.log("Starting Swarm Analysis of Exchange Feature...");
runSwarmOrchestration("Perform an architectural code review of `src/features/exchange/services/exchange/exchange-offers.ts` against the `AGENTS.md` canonical standard (*-records.ts, *-logic.ts, *-actions.ts). Specifically list which parts go where and identify any security/reliability gaps.")
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
