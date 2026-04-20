const fs = require('fs');
const path = 'src/app/(public)/(marketplace)/listing/[slug]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
// Line 510 in the view (1-indexed) is index 509 (0-indexed)
const cleanedLines = lines.filter((line, index) => index !== 509);
fs.writeFileSync(path, cleanedLines.join('\n'), 'utf8');
console.log('Removed line index 509');
