const fs = require('fs');
const path = require('path');

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
      
      // Fix double commas inside import {}
      if (content.includes(', ,')) {
        content = content.replace(/,\s*,/g, ',');
        changed = true;
      }
      if (content.includes('{ ,')) {
        content = content.replace(/\{\s*,/g, '{');
        changed = true;
      }
      if (content.includes(', }')) {
        content = content.replace(/,\s*\}/g, '}');
        changed = true;
      }
      if (content.includes('{  }')) {
        content = content.replace(/import \{\s*\} from "@\/lib";\n/g, '');
        changed = true;
      }
      // specifically `import {  , formatNumber,  , supabaseImageUrl } from "@/lib";`
      // will become `import { formatNumber, supabaseImageUrl } from "@/lib";`
      let oldContent = "";
      while (oldContent !== content) {
          oldContent = content;
          content = content.replace(/,\s*,/g, ',');
          content = content.replace(/\{\s*,/g, '{ ');
          content = content.replace(/,\s*\}/g, ' }');
      }
      
      if (content !== fs.readFileSync(itemPath, 'utf8')) {
        fs.writeFileSync(itemPath, content, 'utf8');
        console.log(`Cleaned up import syntax in ${itemPath}`);
      }
    }
  }
}

processDirectory('src');
console.log("Syntax cleanup complete.");
