import { runAgentLoop } from "../scripts/copilot/agent.mjs";
import { activeContextFiles } from "../scripts/copilot/config.mjs";
import fs from "fs";
import path from "path";

// Target small files only
const targetFiles = [
  "src/features/marketplace/services/listings/listing-query-types.ts",
  "src/features/marketplace/services/listings/listing-query-builder.ts",
  "TASKS.md",
  "PROGRESS.md"
];

console.log("Preparing lean preloaded context...");
activeContextFiles.clear();
targetFiles.forEach(f => {
  if (fs.existsSync(path.resolve(process.cwd(), f))) {
    activeContextFiles.add(f);
  }
});

// Inject target type snippet directly so we don't load 3200 lines
const supabaseContent = fs.readFileSync(path.resolve(process.cwd(), "src/types/supabase.ts"), "utf-8").split("\n");
const listingsSnippet = supabaseContent.slice(1148, 1343).join("\n");

const prompt = `Sen tam döngü çalışan uzman bir Ajanısın.

DÖKÜMANTASYON BİLGİSİ (Supabase Listing Row Type):
\`\`\`typescript
${listingsSnippet}
\`\`\`

HEDEF:
1. "src/features/marketplace/services/listings/listing-query-types.ts" içindeki 'any' tiplerini temizle ve PostgrestFilterBuilder Generic'ini 'Database["public"]["Tables"]["listings"]["Row"]' tipine bağla.
2. "src/features/marketplace/services/listings/listing-query-builder.ts" içindeki 'cursor' kıyaslamalarını zayıf .lt() mantığından, lexicographical tuple comparison (tie-breaker id) kullanan Supabase .or() mantığına geçir.
Sıralama yönüne göre (asc/desc) cursor kıyasının yönünü doğru belirle.

ÇALIŞMA TALİMATI:
1. Zaten sisteminde 'activeContextFiles' olarak 2 ana dosya, TASKS.md ve PROGRESS.md bulunuyor! Ve yukarıda supabase tip snippet'i verildi.
2. Kod değişikliklerini <edit_file> veya <write_file> etiketi içinde oluştur.
3. Değişiklikleri yaptıktan sonra AYNI YANIT İÇİNDE [RUN_TYPECHECK] aracını çağırarak tip kontrolünü yap. Hata olursa Self-Healing ile otomatik düzelteceğiz.
4. Dökümantasyonu (TASKS.md, PROGRESS.md) güncellemeyi UNUTMA.
`;

console.log("Igniting optimized agent loop with precise snippet context...");
await runAgentLoop(prompt, { autoApply: true });
console.log("Execution complete.");
