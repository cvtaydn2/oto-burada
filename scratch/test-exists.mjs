import fs from 'fs';
import path from 'path';

const relPath = "scripts/copilot/orchestrator.mjs";
const fullPath = path.resolve(process.cwd(), relPath);
console.log("Rel Path:", relPath);
console.log("Full Path:", fullPath);
console.log("Exists:", fs.existsSync(fullPath));
