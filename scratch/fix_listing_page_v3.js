const fs = require('fs');
const path = 'src/app/(public)/(marketplace)/listing/[slug]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const cleanedLines = lines.filter(line => !line.includes('İLANİ Ã…ÂžİKAYET ET') && !line.includes('Ã…Âž'));
fs.writeFileSync(path, cleanedLines.join('\n'), 'utf8');
console.log('Fixed file via trim/filter');
