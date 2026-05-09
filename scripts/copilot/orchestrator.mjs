import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { runSpecialistsInPipeline, runSwarmVerification } from "./specialists.mjs";
import { callClaudeRaw } from "./agent.mjs";
import { activeContextFiles, conversationHistory } from "./config.mjs";
import { reset, bold, blue, purple, green, cyan, yellow, red, gray } from "./colors.mjs";
import { parseXmlFiles, safeReadFile, applyChanges, executeCommand } from "./tools.mjs";

// Multi-Agent Swarm Orchestrator (Aria + Atlas + Vera)
export async function runSwarmOrchestration(taskDescription) {
  console.log(`\n${blue}${bold}=======================================================${reset}`);
  console.log(`${blue}${bold}      🎻 MULTI-AGENT SWARM ORCHESTRATOR v1.0 🎻        ${reset}`);
  console.log(`${purple}${bold}         Atlas (Data) -> Aria (UI) -> Vera (QA)        ${reset}`);
  console.log(`${blue}${bold}=======================================================${reset}\n`);

  let context = "";
  const MAX_CONTEXT_CHARS_PER_FILE = 8000;
  const MAX_CONTEXT_LINES_PER_FILE = 300;

  if (activeContextFiles.size > 0) {
    context += "Hafızadaki güncel dosyalar (ilk bölüm):\n";
    for (const file of activeContextFiles) {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;

      let content = safeReadFile(fullPath);

      const lines = content.split("\n");
      if (lines.length > MAX_CONTEXT_LINES_PER_FILE) {
        content = lines.slice(0, MAX_CONTEXT_LINES_PER_FILE).join("\n") +
          `\n\n[... ${lines.length - MAX_CONTEXT_LINES_PER_FILE} satır kısaltıldı. Tamamı için [READ_FILE: ${file}] kullan ...]`;
      }
      if (content.length > MAX_CONTEXT_CHARS_PER_FILE) {
        content = content.slice(0, MAX_CONTEXT_CHARS_PER_FILE) +
          `\n\n[... içerik kısaltıldı. Tamamı için [READ_FILE: ${file}] kullan ...]`;
      }

      context += `\n--- DOSYA: ${file} ---\n${content}\n`;
    }
  }
  
  // KRİTİK GELİŞTİRME (Aşama 2): AGENTS.md anayasası her zaman enjeksiyon edilir.
  const agentsPath = path.resolve(process.cwd(), "AGENTS.md");
  if (fs.existsSync(agentsPath)) {
    context += `\n\n=== PROJE ANAYASASI (ZORUNLU KURALLAR) ===\n${fs.readFileSync(agentsPath, "utf-8")}\n`;
  }

  let iterations = 0;
  const maxLoops = 3;
  let frontendSolution = "";
  let backendSolution = "";
  let currentPrompt = taskDescription;

  while (iterations < maxLoops) {
    iterations++;
    console.log(`${purple}${bold}🛸 Swarm Adım ${iterations}: Uzmanlar sıralı boru hattında (Pipeline) çalışıyor...${reset}`);

    // Atlas (Backend/DB) -> Aria (UI) sıralı (Pipeline) istekleri tetikleniyor
    const solutions = await runSpecialistsInPipeline(currentPrompt, context);
    frontendSolution = solutions.frontend;
    backendSolution = solutions.backend;

    // Vera (QA) çözümleri doğrulamaya alıyor
    const verification = await runSwarmVerification(frontendSolution, backendSolution, taskDescription);

    if (verification.status === "APPROVED") {
      console.log(`\n${green}${bold}✓ Swarm doğrulaması başarıyla tamamlandı! Final sentezi yapılıyor...${reset}`);
      break;
    }

    if (iterations === maxLoops) {
      console.log(`\n${yellow}⚠️ Maksimum swarm döngüsüne ulaşıldı. En güncel sürümler birleştiriliyor...${reset}`);
      break;
    }

    console.log(`\n${red}🔄 Düzeltme Döngüsü ${iterations} Başlatılıyor: Vera'nın geri bildirimleri uzmanlara iletiliyor...${reset}`);
    currentPrompt = `QA Ajanı Vera'nın geri bildirimleri doğrultusunda çözümü iyileştir.\n\nQA Geri Bildirimi:\n${verification.feedback}\n\nOrijinal Görev:\n${taskDescription}`;
  }

  // Final Sentezi (Reviewer/Synthesizer Agent)
  console.log(`\n${cyan}✍️  Final Sentezci Ajan çözümleri tek bir premium çözüm paketinde birleştiriyor...${reset}`);
  const synthesisPrompt = `Sen Final Sentezci Ajansın. Aria (Frontend) ve Atlas (Backend) çözümlerini, Vera (QA) onayından geçmiş şekilde birleştirip, mükemmel ve eksiksiz tek bir çözüm dosyası oluştur.
Oluşturulacak veya güncellenecek tüm kod dosyalarını kesinlikle <write_file path="...">...</write_file> etiketleri içinde tam sürüm olarak sun.

Frontend Çözüm Parçaları:
${frontendSolution}

Backend Çözüm Parçaları:
${backendSolution}`;

  let finalSynthesis = await callClaudeRaw(synthesisPrompt, context);

// GÜVENLİK KONTROLÜ: "Tembel Çıktı" Denetimi (Lazy Placeholder Check)
   const lazyPatterns = [/existing code/, /.../g, /rest of/i, /kalan kod/i, /kodun devamı/i];
   let lazyMatches = 0;
   const changes = parseXmlFiles(finalSynthesis);
   
   // Sadece dosya bloklarının içini tara (açıklamalardaki ... noktalarını görmezden gel)
   for(const change of changes) {
     const code = change.code || "";
     if (code.includes("// ...") || code.includes("/* ...") || code.includes("// rest of") || code.includes("/* existing")
         || code.includes("// TODO") || code.includes("// FIXME") || code.includes("TODO:") 
         || code.includes("FIXME:") || code.includes("stub") || code.includes("placeholder")
         || code.includes("// Your code here") || code.includes("/* Your code here")) {
       lazyMatches++;
     }
   }

  if (lazyMatches > 0) {
    console.log(`\n${red}${bold}⚠️  KRİTİK GÜVENLİK İHLALİ: Final sentezde 'Tembel Kod Parçası' (Placeholder) tespit edildi!${reset}`);
    console.log(`${yellow}🔄 Otomatik Kendi Kendini Düzeltme (Self-Healing) tetikleniyor...${reset}`);
    const healingPrompt = `Ürettiğin kod bloklarında '// ... existing code' gibi tembel kısıtlamalar veya placeholder'lar tespit ettim. 
LÜTFEN TÜM DOSYALARI HİÇBİR KISMI ATLAMADAN, TAM VE EKSİKSİZ OLARAK YENİDEN YAZ. TEK BİR SATIR BİLE KESİLEMEZ.
Oluşturulacak veya güncellenecek tüm kod dosyalarını kesinlikle <write_file path="...">...</write_file> etiketleri içinde TAM SÜRÜM OLARAK SUN.`;
    finalSynthesis = await callClaudeRaw(healingPrompt, `${context}\n\n=== Önceki Hatalı Çıktı ===\n${finalSynthesis}`);
    console.log(`${green}✓ Self-healing tamamlandı.${reset}`);
  }

  saveSwarmSolution(finalSynthesis);

  console.log(`\n${cyan}${bold}🔬 Post-Synthesis Doğrulama: Lint & Typecheck çalıştırılıyor...${reset}`);

  const lintOutput = executeCommand("npm run lint").trim();
  const typecheckOutput = executeCommand("npm run typecheck").trim();

  const lintFailed = lintOutput.toLowerCase().includes("error") || lintOutput.includes("✖");
  const typecheckFailed = typecheckOutput.toLowerCase().includes("error");

  if (!lintFailed && !typecheckFailed) {
    console.log(`${green}✓ Lint & Typecheck temiz!${reset}`);
  } else {
    if (lintFailed) {
      console.log(`${red}❌ Lint Hataları Tespit Edildi:${reset}`);
      console.log(`${yellow}${lintOutput.slice(0, 1500)}${reset}`);
    }
    if (typecheckFailed) {
      console.log(`${red}❌ TypeScript Hataları Tespit Edildi:${reset}`);
      console.log(`${yellow}${typecheckOutput.slice(0, 1500)}${reset}`);
    }
    console.log(`\n${yellow}🔄 Self-Healing döngüsü başlatılıyor...${reset}`);
    const errorSummary = [
      lintFailed ? `=== LINT HATALARI ===\n${lintOutput.slice(0, 1000)}` : "",
      typecheckFailed ? `=== TYPECHECK HATALARI ===\n${typecheckOutput.slice(0, 1000)}` : "",
    ].filter(Boolean).join("\n\n");

    const postHealingPrompt =
      `Swarm çözümü üretildi ancak otomatik doğrulama hataları tespit etti:\n\n${errorSummary}\n\n` +
      `Lütfen bu hataları gidermek için ilgili dosyaları <write_file> veya <delete_file> etiketleriyle düzelt.`;

    const healedOutput = await callClaudeRaw(postHealingPrompt, context);

    if (healedOutput) {
      const healedChanges = parseXmlFiles(healedOutput);
      if (healedChanges.length > 0) {
        console.log(`${cyan}🔧 ${healedChanges.length} düzeltme dosyası uygulanıyor...${reset}`);
        try {
          applyChanges(healedChanges);
          console.log(`${green}✓ Post-healing düzeltmeleri başarıyla uygulandı.${reset}`);
        } catch (e) {
          console.log(`${red}❌ Post-healing hatası: ${e.message}${reset}`);
        }
      }
    }
  }

  // Sohbet geçmişini güncelle
  conversationHistory.push({ role: "user", content: taskDescription });
  conversationHistory.push({ role: "assistant", content: finalSynthesis });
}

function saveSwarmSolution(content) {
  const scratchDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir);
  }

  const solutionPath = path.resolve(scratchDir, "copilot-solution.md");
  fs.writeFileSync(solutionPath, content, "utf-8");

  const changes = parseXmlFiles(content);

  console.log(`\n${green}${bold}=======================================================${reset}`);
  console.log(`${green}${bold}✓ Swarm Çözüm Raporu başarıyla kaydedildi:${reset}`);
  console.log(`${cyan}${solutionPath}${reset}`);
  if (changes.length > 0) {
    console.log(`${yellow}🛸 Swarm Önerilen Kod Değişiklikleri: ${changes.length} dosya tespit edildi.${reset}`);
    changes.forEach((c) => console.log(`   - ${cyan}${c.path}${reset}`));
  }
  console.log(`${purple}${bold}👉 Antigravity Asistanı İçin Hazır!${reset}`);
  console.log(`${gray}Bana (Antigravity'ye) dönüp şu cümleyi yazarak tüm kodu otomatik uygulatabilirsiniz:${reset}`);
  console.log(`${bold}${cyan}"scratch/copilot-solution.md dosyasındaki çözümü projeye uygula"${reset}`);
  console.log(`${green}${bold}=======================================================${reset}\n`);
}
