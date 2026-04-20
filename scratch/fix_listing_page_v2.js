const fs = require('fs');
const path = 'src/app/(public)/(marketplace)/listing/[slug]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Filter out the specific junk lines
const cleanedLines = lines.filter((line, index) => {
    // Check for the known garbage at the known range
    if (line.includes('İLANİ Ã…ÂžİKAYET ET')) return false;
    if (line.trim() === '</Link>' && index >= 510 && index <= 515) return false;
    if (line.trim() === '</div>' && index >= 510 && index <= 515) return false;
    return true;
});

fs.writeFileSync(path, cleanedLines.join('\n'), 'utf8');
console.log('Fixed file via split/filter');
