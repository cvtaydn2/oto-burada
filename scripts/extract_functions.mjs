import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

const functions = [];
const seenFunctions = new Set();

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to match function definitions starting with CREATE [OR REPLACE] FUNCTION and ending with $$; or similar
  // Let's use a robust stateful parser instead of regex to match nested structures or multiple dollars
  const lines = content.split('\n');
  let inFunction = false;
  let functionBlock = [];
  let functionName = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase().trim();
    
    if (!inFunction && (upperLine.startsWith('CREATE FUNCTION') || upperLine.startsWith('CREATE OR REPLACE FUNCTION'))) {
      inFunction = true;
      functionBlock = [line];
      
      // Extract function name for deduplication
      const match = line.match(/(?:FUNCTION|function)\s+([a-zA-Z0-9_\.]+)/);
      functionName = match ? match[1] : `unknown_${Date.now()}`;
    } else if (inFunction) {
      functionBlock.push(line);
      // A function ends when we see $$; or similar delimiter and plpgsql/sql is completed.
      // Usually, it's $$ [SECURITY DEFINER...] ; or similar, ending with $$;
      if (upperLine.endsWith('$$;') || upperLine === '$$;' || (upperLine.includes('$$') && lines[i+1]?.trim() === ';') || upperLine.includes('END; $$') || upperLine.endsWith('$$')) {
        // Double check if next line is a semicolon or if it is fully ended
        let fullBlock = functionBlock.join('\n');
        if (upperLine.endsWith('$$') && lines[i+1]?.trim() === ';') {
          fullBlock += '\n;';
          i++;
        }
        
        functions.push({
          file,
          name: functionName,
          sql: fullBlock
        });
        inFunction = false;
      }
    }
  }
}

console.log(`Found ${functions.length} functions.`);
const uniqueFunctions = {};
for (const fn of functions) {
  uniqueFunctions[fn.name] = fn.sql;
}

console.log(`Unique functions found: ${Object.keys(uniqueFunctions).length}`);
fs.writeFileSync('extracted_functions.sql', Object.values(uniqueFunctions).join('\n\n'));
console.log('Saved to extracted_functions.sql');
