import { handleSelfDiagnose } from "../scripts/copilot/commands.mjs";

async function run() {
  try {
    // autoApply: false gives us control over accepting changes later
    await handleSelfDiagnose({ autoApply: false });
    process.exit(0);
  } catch (err) {
    console.error("Error during diagnose:", err);
    process.exit(1);
  }
}

run();
