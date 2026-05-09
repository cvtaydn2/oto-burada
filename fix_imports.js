const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  {
    path: 'src/features/profile/components/seller-rating-info.tsx',
    replacements: [
      { from: /import { cn } from "@\/lib";/, to: 'import { cn } from "@/lib/utils";' }
    ]
  },
  {
    path: 'src/features/profile/services/profile/profile-records.ts',
    replacements: [
      { from: /import { profileSchema } from "@\/lib";/, to: 'import { profileSchema } from "@/lib/validators/auth";' },
      { from: /import { (.*)profileSchema(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { profileSchema } from "@/lib/validators/auth";' }
    ]
  },
  {
    path: 'src/features/reports/services/reports/report-submissions.ts',
    replacements: [
      { from: /import { reportSchema(.*) } from "@\/lib";/, to: 'import { reportSchema$1 } from "@/lib/validators/feedback";' },
      { from: /import { (.*)reportSchema(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { reportSchema } from "@/lib/validators/feedback";' }
    ]
  },
  {
    path: 'src/features/reservations/components/dashboard-reservations-table.tsx',
    replacements: [
      { from: /import { (.*)formatPrice(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { formatPrice } from "@/lib/utils/format";' }
    ]
  },
  {
    path: 'src/features/reservations/components/reservation-countdown.tsx',
    replacements: [
      { from: /import { cn } from "@\/lib";/, to: 'import { cn } from "@/lib/utils";' },
      { from: /import { (.*)cn(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { cn } from "@/lib/utils";' }
    ]
  },
  {
    path: 'src/features/reservations/components/reserve-button.tsx',
    replacements: [
      { from: /import { cn } from "@\/lib";/, to: 'import { cn } from "@/lib/utils";' },
      { from: /import { (.*)cn(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { cn } from "@/lib/utils";' }
    ]
  },
  {
    path: 'src/features/support/components/admin-ticket-list.tsx',
    replacements: [
      { from: /import { cn } from "@\/lib";/, to: 'import { cn } from "@/lib/utils";' },
      { from: /import { (.*)cn(.*) } from "@\/lib";/, to: 'import { $1 $2 } from "@/lib";\nimport { cn } from "@/lib/utils";' }
    ]
  }
];

for (const file of filesToUpdate) {
  const fullPath = path.join(__dirname, file.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    for (const rep of file.replacements) {
      if (rep.from.test(content)) {
        content = content.replace(rep.from, rep.to);
        // clean up empty imports if any
        content = content.replace(/import { , } from "@\/lib";\n/, '');
        content = content.replace(/import {  } from "@\/lib";\n/, '');
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed imports in ${file.path}`);
    } else {
       console.log(`Regex not matched in ${file.path}`);
    }
  } else {
    console.log(`File not found: ${file.path}`);
  }
}
