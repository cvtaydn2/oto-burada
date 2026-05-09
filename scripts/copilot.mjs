import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { activeContextFiles, conversationHistory } from "./copilot/config.mjs";
import { reset, bold, blue, purple, green, cyan, yellow, red, gray } from "./copilot/colors.mjs";
import { getFilesRecursively, executeCommand, invalidateFilesCache } from "./copilot/tools.mjs";
import { runSwarmOrchestration } from "./copilot/orchestrator.mjs";
import {
  handleConstitutionalReview,
  handleNextTaskSolver,
  handleSchemaExplorer,
  handleConflictResolver,
  handleSkillWriter,
  handleOrchestra,
  handleSelfDiagnose,
  handleSemanticCommit,
} from "./copilot/commands.mjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

function printHeader() {
  console.clear();
  console.log(`${blue}${bold}=======================================================${reset}`);
  console.log(`${blue}${bold}        🛸 OtoBurada Agentic Copilot v5.0 (Elite) 🛸    ${reset}`);
  console.log(`${purple}${bold}           Self-Healing, Otonom Grep & Premium Kabuk     ${reset}`);
  console.log(`${gray}           Claude Opus 4.6 (Netiva) ile Güçlendirildi  ${reset}`);
  console.log(`${blue}${bold}=======================================================${reset}`);
  console.log(`${green}✓ .agents/rules anayasa kuralları sisteme yüklendi.${reset}`);
  console.log(`${green}✓ Aria (UI) + Atlas (Data) + Vera (QA) paralel ajanları aktif.${reset}`);
  console.log(`${green}✓ Otonom Yazma & Test Etme (Self-Healing) sistemi aktif!${reset}`);
  console.log(`${green}✓ Ultra-Hızlı İçerik Arama (Grep Engine) devrede.${reset}`);
  console.log(`${gray}Komut listesi için ${yellow}/help${gray} yazın.${reset}\n`);
}

async function showHelp() {
  console.log(`\n${bold}🛸 Kullanılabilir Komutlar:${reset}`);
  console.log(`  ${yellow}/add <kelime>${reset}    : Projede fuzzy arama yapıp dosyaları hafızaya ekler.`);
  console.log(`  ${yellow}/addall <klasör>${reset} : Klasördeki tüm dosyaları hafızaya ekler (örn: /addall src/features).`);
  console.log(`  ${yellow}/files${reset}           : Hafızadaki (Claude'a gönderilen) dosyaları listeler.`);
  console.log(`  ${yellow}/remove <isim>${reset}   : Bir dosyayı hafızadan çıkarır.`);
  console.log(`  ${yellow}/stats${reset}            : Hafızadaki dosyaların boyut ve yaklaşık token istatistikleri.`);
  console.log(`  ${yellow}/clear${reset}            : Sohbet geçmişini ve hafızadaki dosyaları temizler.`);
  console.log(`  ${yellow}/typecheck${reset}        : TypeScript derleme kontrolü yapar.`);
  console.log(`  ${yellow}/lint${reset}             : ESLint kontrolü yapar.`);
  console.log(`  ${yellow}/paste${reset}            : Çoklu satır yapıştırma modunu başlatır.`);
  console.log(`  ${yellow}/review${reset}           : 🛡️ Yapılan değişiklikleri anayasaya göre denetler.`);
  console.log(`  ${yellow}/next${reset}             : 🎯 TASKS.md ve PROGRESS.md'yi okuyarak sıradaki görevi çözer.`);
  console.log(`  ${yellow}/schema${reset}           : 💾 Veritabanı tablolarını ve RLS şemasını sorgular.`);
  console.log(`  ${yellow}/resolve${reset}          : ⚔️  Otonom çakışma (merge conflict) çözücü.`);
  console.log(`  ${yellow}/skill${reset}            : 🪄 Otonom beceri (Agent Skill) oluşturucu.`);
  console.log(`  ${yellow}/diagnose${reset}         : 🔍 Kendi kendini teşhis etme ve otomatik iyileştirme modu.`);
  console.log(`  ${yellow}/swarm <talimat>${reset}  : 🐝 Çoklu-Ajan paralel döngü modu (Aria + Atlas + Vera).`);
  console.log(`  ${yellow}/orchestra${reset}        : 🎻 Tam döngü otonom proje orkestrasyonu (Kod + Test).`);
  console.log(`  ${yellow}/commit${reset}           : 🐙 Git değişikliklerinden semantik conventional commit mesajı üretir.`);
  console.log(`  ${yellow}/help${reset}             : Bu yardım menüsünü görüntüler.`);
  console.log(`  ${yellow}/exit${reset}             : Kabuktan çıkış yapar.\n`);
}

async function handleFuzzyAdd(searchTerm) {
  if (!searchTerm) {
    console.log(`${red}⚠️ Lütfen aranacak kelimeyi girin. (Örn: /add favorite)${reset}`);
    return;
  }

  console.log(`${gray}Dosyalar taranıyor...${reset}`);
  const allFiles = getFilesRecursively(process.cwd());
  const matches = allFiles.filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

  if (matches.length === 0) {
    console.log(`${yellow}⚠️ '${searchTerm}' ile eşleşen dosya bulunamadı.${reset}`);
    return;
  }

  console.log(`\n${green}🔎 Bulunan Eşleşmeler:${reset}`);
  matches.forEach((f, idx) => console.log(`   ${idx + 1}. ${f}`));

  const choice = await askQuestion(`\n${cyan}Eklemek istediğiniz dosya numarasını girin (hepsi için 'all', iptal için boş bırakın): ${reset}`);
  if (choice.toLowerCase() === "all") {
    matches.forEach((f) => activeContextFiles.add(f));
    console.log(`${green}✓ ${matches.length} dosya hafızaya eklendi.${reset}`);
  } else {
    const idx = parseInt(choice) - 1;
    if (matches[idx]) {
      activeContextFiles.add(matches[idx]);
      console.log(`${green}✓ ${matches[idx]} hafızaya eklendi.${reset}`);
    } else {
      console.log(`${gray}İşlem iptal edildi.${reset}`);
    }
  }
}

async function handleAddAll(folderPath) {
  if (!folderPath) {
    console.log(`${red}⚠️ Lütfen eklenecek klasör yolunu belirtin. (Örn: /addall src/features)${reset}`);
    return;
  }

  const absolutePath = path.resolve(process.cwd(), folderPath);
  if (!fs.existsSync(absolutePath)) {
    console.log(`${red}⚠️ '${folderPath}' klasörü bulunamadı.${reset}`);
    return;
  }

  // Önbelleği temizle ve klasör altındaki tüm dosyaları bul
  invalidateFilesCache();
  const allFiles = getFilesRecursively(process.cwd());
  const folderRelPath = folderPath.replace(/\\/g, "/");
  const matches = allFiles.filter((f) => f.startsWith(folderRelPath));

  if (matches.length === 0) {
    console.log(`${yellow}⚠️ '${folderPath}' klasörü altında yüklenecek dosya bulunamadı.${reset}`);
    return;
  }

  matches.forEach((f) => activeContextFiles.add(f));
  console.log(`${green}✓ Klasör altındaki ${matches.length} dosya başarıyla hafızaya eklendi.${reset}`);
}

async function showStats() {
  if (activeContextFiles.size === 0) {
    console.log(`${yellow}⚠️ Hafızada henüz yüklü dosya yok.${reset}`);
    return;
  }

  console.log(`\n${cyan}📊 Hafızadaki Dosya İstatistikleri:${reset}`);
  let totalChars = 0;
  
  for (const file of activeContextFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, "utf-8");
      totalChars += content.length;
      console.log(`   📂 ${file} (${stats.size} Byte, ${content.length} Karakter)`);
    }
  }

  const estimatedTokens = Math.round(totalChars / 4);
  console.log(`\n${bold}Toplam Dosya sayısı : ${green}${activeContextFiles.size}${reset}`);
  console.log(`${bold}Toplam Karakter     : ${green}${totalChars}${reset}`);
  console.log(`${bold}Tahmini Token Yükü  : ${green}~${estimatedTokens} token${reset}`);
}

async function handleMultiLinePaste() {
  console.log(`\n${purple}${bold}🛸 [Çoklu Satır Modu]${reset}`);
  console.log(`${gray}Yapıştırmak istediğiniz metni girin. Bitirmek için yeni bir satıra ${yellow}END${gray} yazın:${reset}\n`);

  let lines = [];
  return new Promise((resolve) => {
    const onLine = (line) => {
      if (line.trim() === "END") {
        rl.removeListener("line", onLine);
        resolve(lines.join("\n"));
      } else {
        lines.push(line);
      }
    };
    rl.on("line", onLine);
  });
}

async function startShell() {
  printHeader();
  
  while (true) {
    const fileCount = activeContextFiles.size;
    const promptPrefix = `\n${blue}${bold}🛸 [Hafıza: ${fileCount} Dosya]${reset} ${gray}>${reset} `;
    const input = await askQuestion(promptPrefix);
    const trimmedInput = input.trim();

    if (!trimmedInput) continue;

    if (trimmedInput.startsWith("/")) {
      const parts = trimmedInput.split(" ");
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ");

      if (cmd === "/exit") {
        console.log(`\n${blue}Hoşçakalın! Görüşmek üzere.${reset}`);
        rl.close();
        process.exit(0);
      } else if (cmd === "/help") {
        await showHelp();
      } else if (cmd === "/add") {
        await handleFuzzyAdd(arg);
      } else if (cmd === "/addall") {
        await handleAddAll(arg);
      } else if (cmd === "/files") {
        if (activeContextFiles.size === 0) {
          console.log(`${yellow}⚠️ Hafızada henüz hiç dosya yok. /add veya otonom tarama ile eklenecektir.${reset}`);
        } else {
          console.log(`\n${green}📂 Hafızadaki Dosyalar (Claude'a gönderilecek):${reset}`);
          Array.from(activeContextFiles).forEach((f, idx) => console.log(`   ${idx + 1}. ${f}`));
        }
      } else if (cmd === "/remove") {
        if (!arg) {
          console.log(`${red}⚠️ Lütfen kaldırılacak dosya adını veya indeksini belirtin.${reset}`);
        } else {
          const filesArr = Array.from(activeContextFiles);
          const idx = parseInt(arg) - 1;
          if (!isNaN(idx) && filesArr[idx]) {
            activeContextFiles.delete(filesArr[idx]);
            console.log(`${green}✓ ${filesArr[idx]} hafızadan kaldırıldı.${reset}`);
          } else if (activeContextFiles.has(arg)) {
            activeContextFiles.delete(arg);
            console.log(`${green}✓ ${arg} hafızadan kaldırıldı.${reset}`);
          } else {
            console.log(`${yellow}⚠️ Hafızada '${arg}' isimli dosya bulunamadı.${reset}`);
          }
        }
      } else if (cmd === "/stats") {
        await showStats();
      } else if (cmd === "/clear") {
        activeContextFiles.clear();
        conversationHistory.length = 0;
        console.log(`${green}✓ Hafıza ve konuşma geçmişi tamamen temizlendi!${reset}`);
      } else if (cmd === "/typecheck") {
        console.log(`\n${cyan}⚡ TypeScript derleme kontrolü çalıştırılıyor (npm run typecheck)...${reset}`);
        const output = executeCommand("npm run typecheck");
        if (output.includes("success") || !output.trim()) {
          console.log(`${green}✓ Harika! TypeScript derlemesi tamamen temiz, sıfır hata!${reset}`);
        } else {
          console.log(`${red}⚠️ TypeScript çıktıları:${reset}`);
          console.log(output);
        }
      } else if (cmd === "/lint") {
        console.log(`\n${cyan}⚡ ESLint denetimi çalıştırılıyor (npm run lint)...${reset}`);
        const output = executeCommand("npm run lint");
        if (output.includes("success") || !output.trim()) {
          console.log(`${green}✓ Harika! ESLint tamamen temiz, sıfır hata!${reset}`);
        } else {
          console.log(`${red}⚠️ ESLint çıktıları:${reset}`);
          console.log(output);
        }
      } else if (cmd === "/paste") {
        const pastedText = await handleMultiLinePaste();
        await runSwarmOrchestration(pastedText);
      } else if (cmd === "/review") {
        await handleConstitutionalReview();
      } else if (cmd === "/next") {
        await handleNextTaskSolver();
      } else if (cmd === "/schema") {
        await handleSchemaExplorer();
      } else if (cmd === "/resolve") {
        await handleConflictResolver();
      } else if (cmd === "/skill") {
        const skillName = await askQuestion(`${cyan}Oluşturmak veya denetlemek istediğiniz becerinin (skill) adını yazın: ${reset}`);
        if (!skillName.trim()) {
          console.log(`${red}⚠️ Beceri adı boş bırakılamaz.${reset}`);
        } else {
          await handleSkillWriter(skillName);
        }
      } else if (cmd === "/diagnose") {
        await handleSelfDiagnose();
      } else if (cmd === "/swarm") {
        if (!arg) {
          console.log(`${red}⚠️ Lütfen swarm talimatını girin. (Örn: /swarm Favorites sayfasındaki UI butonunu yenile ve backend'e bağla)${reset}`);
        } else {
          await runSwarmOrchestration(arg);
        }
      } else if (cmd === "/orchestra") {
        await handleOrchestra(arg);
      } else if (cmd === "/commit") {
        await handleSemanticCommit({ askQuestion, autoApply: false });
      } else {
        const closest = findClosestCommand(cmd);
        if (closest) {
          console.log(`${red}⚠️ Bilinmeyen komut: ${cmd}.${reset} ${yellow}Bunu mu demek istediniz: ${bold}${closest}${reset}`);
        } else {
          console.log(`${red}⚠️ Bilinmeyen komut: ${cmd}. Yardım için /help yazabilirsiniz.${reset}`);
        }
      }
    } else {
      // Düz metin sorgularda da otomatik olarak Swarm Orchestrator'ı tetikleyelim
      await runSwarmOrchestration(trimmedInput);
    }
  }
}

function findClosestCommand(cmd) {
  const list = [
    "/exit", "/help", "/add", "/addall", "/files", "/remove",
    "/stats", "/clear", "/typecheck", "/lint", "/paste",
    "/review", "/next", "/schema", "/resolve", "/skill",
    "/diagnose", "/swarm", "/orchestra", "/commit"
  ];
  let closest = null;
  let minDiff = Infinity;
  for (const item of list) {
    const diff = getLevenshteinDistance(cmd, item);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }
  return minDiff <= 3 ? closest : null;
}

function getLevenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

async function runCliMode() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    startShell();
    return;
  }

  const cmd = args[0].toLowerCase();
  const rest = args.slice(1).join(" ");

  if (cmd === "review" || cmd === "/review") {
    await handleConstitutionalReview();
    process.exit(0);
  } else if (cmd === "next" || cmd === "/next") {
    await handleNextTaskSolver();
    process.exit(0);
  } else if (cmd === "schema" || cmd === "/schema") {
    await handleSchemaExplorer();
    process.exit(0);
  } else if (cmd === "resolve" || cmd === "/resolve") {
    await handleConflictResolver();
    process.exit(0);
  } else if (cmd === "diagnose" || cmd === "/diagnose") {
    await handleSelfDiagnose();
    process.exit(0);
  } else if (cmd === "orchestra" || cmd === "/orchestra") {
    await handleOrchestra(rest);
    process.exit(0);
  } else if (cmd === "commit" || cmd === "/commit") {
    const autoApply = rest.includes("auto") || rest.includes("-y");
    await handleSemanticCommit({ askQuestion, autoApply });
    process.exit(0);
  } else if (cmd === "swarm" || cmd === "/swarm") {
    if (!rest.trim()) {
      console.log(`${red}⚠️ Swarm talimatı belirtilmelidir. (Örn: npm run copilot -- swarm "favorites sayfasını yenile")${reset}`);
      process.exit(1);
    }
    await runSwarmOrchestration(rest);
    process.exit(0);
  } else if (cmd === "typecheck" || cmd === "/typecheck") {
    console.log(`\n${cyan}⚡ TypeScript derleme kontrolü çalıştırılıyor (npm run typecheck)...${reset}`);
    const output = executeCommand("npm run typecheck");
    if (output.includes("success") || !output.trim()) {
      console.log(`${green}✓ Harika! TypeScript derlemesi tamamen temiz, sıfır hata!${reset}`);
    } else {
      console.log(`${red}⚠️ TypeScript çıktıları:${reset}`);
      console.log(output);
    }
    process.exit(0);
  } else if (cmd === "lint" || cmd === "/lint") {
    console.log(`\n${cyan}⚡ ESLint denetimi çalıştırılıyor (npm run lint)...${reset}`);
    const output = executeCommand("npm run lint");
    if (output.includes("success") || !output.trim()) {
      console.log(`${green}✓ Harika! ESLint tamamen temiz, sıfır hata!${reset}`);
    } else {
      console.log(`${red}⚠️ ESLint çıktıları:${reset}`);
      console.log(output);
    }
    process.exit(0);
  } else if (cmd === "help" || cmd === "/help" || cmd === "--help" || cmd === "-h") {
    printHeader();
    await showHelp();
    process.exit(0);
  } else {
    const fullPrompt = args.join(" ");
    await runSwarmOrchestration(fullPrompt);
    process.exit(0);
  }
}

runCliMode();
