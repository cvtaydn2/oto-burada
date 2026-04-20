const fs = require('fs');
const path = 'src/app/(public)/(marketplace)/listing/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix imports
if (!content.includes('MessageSquare')) {
    content = content.replace(
        '  Download,',
        '  Download,\n  MessageSquare,\n  Phone,\n  Calendar,'
    );
}

// Fix character encoding and redundant fragments
content = content.replace(/Ã¢â‚¬Âº|Ã¢â€šÂº/g, '₺');
content = content.replace(/Ã…Âž/g, 'Ş');
content = content.replace(/Ã…Âž/g, 'Ş'); // double check
content = content.replace(/Ã¢â‚¬â„¢/g, "'");

// Remove the specific junk block
const junkPattern = /percase tracking-widest">İLANİ ȘİKAYET ET<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
content = content.replace(junkPattern, '');

// Fix 'İLANİ BİLDİR'
content = content.replace('İLANİ BİLDİR', 'İLAN BİLDİR');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed file');
