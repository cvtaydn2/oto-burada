const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /import { (.*)cn(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { cn } from "@/lib/utils";' },
  { from: /import { cn } from "@\/lib";/, to: 'import { cn } from "@/lib/utils";' },
  
  { from: /import { (.*)formatPrice(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { formatPrice } from "@/lib/utils/format";' },
  { from: /import { formatPrice } from "@\/lib";/, to: 'import { formatPrice } from "@/lib/utils/format";' },
  
  { from: /import { (.*)listingFiltersSchema(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { listingFiltersSchema } from "@/lib/validators/listing";' },
  { from: /import { listingFiltersSchema } from "@\/lib";/, to: 'import { listingFiltersSchema } from "@/lib/validators/listing";' },
  
  { from: /import { (.*)savedSearchSchema(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { savedSearchSchema } from "@/lib/validators/notification";' },
  { from: /import { savedSearchSchema } from "@\/lib";/, to: 'import { savedSearchSchema } from "@/lib/validators/notification";' }
];

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item === '.git' || item === '.agents') continue;
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      processDirectory(itemPath);
    } else if (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx')) {
      let content = fs.readFileSync(itemPath, 'utf8');
      let changed = false;
      
      for (const rep of replacements) {
        if (rep.from.test(content)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      }
      
      if (changed) {
        // clean up
        content = content.replace(/import { ,? ?} from "@\/lib";\n/g, '');
        content = content.replace(/import { } from "@\/lib";\n/g, '');
        fs.writeFileSync(itemPath, content, 'utf8');
        console.log(`Updated imports in ${itemPath}`);
      }
    }
  }
}

processDirectory('src');
console.log("Global import fix complete.");
