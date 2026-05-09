const fs = require('fs');
const path = require('path');

let tsconfigRaw = fs.readFileSync('tsconfig.json', 'utf8');
const tsconfig = JSON.parse(tsconfigRaw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''));

let changed = false;
const paths = tsconfig.compilerOptions.paths;

for (const key in paths) {
  if (key === '@/*') continue;
  
  const targetPaths = paths[key];
  const validPaths = targetPaths.filter(p => {
    let fullPath = path.join(process.cwd(), p);
    if (fs.existsSync(fullPath)) return true;
    if (fs.existsSync(fullPath + '.ts')) return true;
    if (fs.existsSync(fullPath + '.tsx')) return true;
    if (fs.existsSync(fullPath + '/index.ts')) return true;
    if (fs.existsSync(fullPath + '/index.tsx')) return true;
    return false;
  });
  
  if (validPaths.length === 0) {
    console.log(`Removing invalid path mapping: ${key} -> ${targetPaths}`);
    delete paths[key];
    changed = true;
  } else if (validPaths.length !== targetPaths.length) {
    paths[key] = validPaths;
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2), 'utf8');
  console.log("tsconfig.json updated.");
} else {
  console.log("No changes to tsconfig.json");
}
