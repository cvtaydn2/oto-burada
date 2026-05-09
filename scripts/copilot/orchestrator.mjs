import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { runSpecialistsInPipeline, runSwarmVerification } from "./specialists.mjs";
import { callClaudeRaw } from "./agent.mjs";
import { activeContextFiles, conversationHistory } from "./config.mjs";
import { reset, bold, blue, purple, green, cyan, yellow, red, gray } from "./colors.mjs";
import { parseXmlFiles, safeReadFile } from "./tools.mjs";

// Multi-Agent Swarm Orchestrator (Aria + Atlas + Vera)
export async function runSwarmOrchestration(taskDescription) {
  console.log(`\n${blue}${bold}=======================================================${reset}`);
  console.log(`${blue}${bold}      🎻 MULTI-AGENT SWARM ORCHESTRATOR v1.0 🎻        ${reset}`);
  console.log(`${purple}${bold}         Atlas (Data) -> Aria (UI) -> Vera (QA)        ${reset}`);
  console.log(`${blue}${bold}=======================================================${reset}\n`);

  let context = "";
  if (activeContextFiles.size > 0) {
    context += "Hafızadaki güncel dosyalar:\n";
    for (const file of activeContextFiles) {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        context += `\n--- DOSYA: ${file} ---\n${safeReadFile(fullPath)}\n`;
      }
    }
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

  const finalSynthesis = await callClaudeRaw(synthesisPrompt, context);

  saveSwarmSolution(finalSynthesis);

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
