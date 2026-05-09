const fs = require('fs');
const path = require('path');

const mappings = {
  formatNumber: '@/lib/utils/format',
  formatCurrency: '@/lib/utils/format',
  formatTL: '@/lib/utils/format',
  formatDate: '@/lib/datetime/date-utils',
  safeFormatDate: '@/lib/datetime/date-utils',
  safeFormatDistanceToNow: '@/lib/datetime/date-utils',
  supabaseImageUrl: '@/lib/utils/image',
  adminModerationActionSchema: '@/lib/validators/admin',
  loginSchema: '@/lib/validators/auth',
  registerSchema: '@/lib/validators/auth',
  resetPasswordSchema: '@/lib/validators/auth',
  profileUpdateSchema: '@/lib/validators/auth',
  corporateProfileSchema: '@/lib/validators/auth',
  listingFiltersSchema: '@/lib/validators/marketplace',
};

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
      
      // We look for any import from "@/lib" and check if it imports any of the targets
      const importLibRegex = /import\s+{([^}]+)}\s+from\s+["']@\/lib["'];?/g;
      
      content = content.replace(importLibRegex, (match, importsStr) => {
        let imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
        let remainingImports = [];
        let newImports = {};
        
        for (const imp of imports) {
          if (mappings[imp]) {
            changed = true;
            if (!newImports[mappings[imp]]) newImports[mappings[imp]] = [];
            newImports[mappings[imp]].push(imp);
          } else {
            remainingImports.push(imp);
          }
        }
        
        let result = '';
        if (remainingImports.length > 0) {
          result += `import { ${remainingImports.join(', ')} } from "@/lib";\n`;
        }
        
        for (const [modulePath, imps] of Object.entries(newImports)) {
          result += `import { ${imps.join(', ')} } from "${modulePath}";\n`;
        }
        
        return result.trim() === '' ? match : result.trim();
      });

      if (changed) {
        fs.writeFileSync(itemPath, content, 'utf8');
        console.log(`Updated imports in ${itemPath}`);
      }
    }
  }
}

processDirectory('src');
console.log("Remaining imports fixed.");
