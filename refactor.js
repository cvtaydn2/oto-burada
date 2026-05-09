const fs = require('fs');
const path = require('path');

// 1. Move directories
const moves = [
  { from: 'src/features/ui/components', to: 'src/components/ui' },
  { from: 'src/features/shared/components', to: 'src/components/shared' },
  { from: 'src/features/layout/components', to: 'src/components/layout' },
  { from: 'src/features/forms/components', to: 'src/components/forms' },
  { from: 'src/features/shared/hooks', to: 'src/hooks' },
  { from: 'src/features/shared/lib', to: 'src/lib' },
];

function ensureDirSync(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

function moveContents(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDirSync(dest);
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    fs.renameSync(srcPath, destPath);
  }
}

moves.forEach(m => {
  console.log(`Moving ${m.from} to ${m.to}`);
  moveContents(m.from, m.to);
});

// Remove empty directories
['src/features/ui', 'src/features/layout', 'src/features/forms'].forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch(e) {}
  }
});

// 2. Global Find and Replace
const exactReplacements = [
  { from: /@\/features\/ui\/components/g, to: '@/components/ui' },
  { from: /@\/features\/shared\/components/g, to: '@/components/shared' },
  { from: /@\/features\/layout\/components/g, to: '@/components/layout' },
  { from: /@\/features\/forms\/components/g, to: '@/components/forms' },
  { from: /@\/features\/shared\/hooks/g, to: '@/hooks' },
  { from: /@\/features\/shared\/lib/g, to: '@/lib' },
];

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item === '.git' || item === '.agents') continue;
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      processDirectory(itemPath);
    } else if (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx') || itemPath.endsWith('.js') || itemPath.endsWith('.json')) {
      let content = fs.readFileSync(itemPath, 'utf8');
      let changed = false;
      
      for (const rep of exactReplacements) {
        if (rep.from.test(content)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(itemPath, content, 'utf8');
        console.log(`Updated imports in ${itemPath}`);
      }
    }
  }
}

processDirectory('src');
console.log("Refactoring complete.");
