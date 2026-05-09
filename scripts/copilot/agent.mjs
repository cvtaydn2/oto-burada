import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { apiKey, baseUrl, model, activeContextFiles, conversationHistory } from "./config.mjs";
import { reset, bold, blue, purple, green, cyan, yellow, red, gray } from "./colors.mjs";
import { getFilesRecursively, parseAndApplyXmlFiles, parseXmlFiles, applyChanges, executeCommand, safeReadFile } from "./tools.mjs";

// Terminal Yükleniyor Döndürücüsü (Premium Spinner UX)
export function startSpinner(message) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let startTime = Date.now();
  const MIN_DISPLAY_MS = 200;

  // İlk satırı yaz
  process.stdout.write(`\r${cyan}${frames[0]}${reset} ${message}`);
  const interval = setInterval(() => {
    process.stdout.write(`\r${cyan}${frames[i % frames.length]}${reset} ${message}`);
    i++;
  }, 80);

  return {
    stop: async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DISPLAY_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_DISPLAY_MS - elapsed));
      }
      clearInterval(interval);
      process.stdout.write(`\r\x1b[K`); // Satırı tamamen temizle
    }
  };
}

// Proje Anayasasını Yükle (.agents/rules altındaki kurallar)
export function loadConstitutionRules() {
  const rulesDir = path.resolve(process.cwd(), ".agents/rules");
  let constitutionText = "";

  if (fs.existsSync(rulesDir)) {
    const list = fs.readdirSync(rulesDir);
    for (const file of list) {
      if (file.endsWith(".md") && file !== "README.md") {
        const filePath = path.join(rulesDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const ruleName = file.replace("-rules.md", "").replace(".md", "").toUpperCase();
        constitutionText += `\n\n=== ${ruleName} CONSTITUTION RULES ===\n${content}`;
      }
    }
  }
  return constitutionText;
}


// Token Hesabı ve Geçmiş Yönetimi (Bellek Optimizasyonu)
const MAX_HISTORY_MESSAGES = 10;
const MAX_CONTEXT_TOKENS = 50000;

function estimateTokens(text) {
  return Math.ceil((text || "").length / 3.5);
}

function getWindowedHistory() {
  let history = [...conversationHistory].slice(-MAX_HISTORY_MESSAGES);
  let totalTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  while (totalTokens > MAX_CONTEXT_TOKENS && history.length > 2) {
    history.shift();
    totalTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }
  return history;
}

// Güvenlik: API Anahtarlarını ve Gizli Verileri Temizler (Redaction)
function sanitizeErrorOutput(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-[REDACTED]")
    .replace(/"api_key":\s*"[^"]+"/g, '"api_key": "[REDACTED]"');
}

// Claude API İstek Gönderici (Konsistens ve Sıfır Sıcaklık Odaklı)
export async function callClaudeRaw(prompt, extraContext = "") {
  if (!apiKey) {
    console.log(`${red}${bold}⚠️ CLAUDE_NETIVA_KEY, .env.local dosyasında tanımlı değil!${reset}`);
    process.exit(1);
  }

  const constitutionRules = loadConstitutionRules();

  const systemPrompt = `Sen OtoBurada projesinde çalışan otonom ve uzman bir Agentic AI Yazılım Mühendisi ve Sistem Mimarısın (Claude Opus 4.6).
Geliştiricinin talimatına göre projeyi analiz edip mükemmel, güvenli ve typesafe çözüm raporları hazırlarsın.

KONSİSTENS VE TUTARLILIK KURALI:
- Aynı soruya veya probleme her zaman tutarlı, deterministik ve mükemmel çözümler üretmelisin.
- Çözümlerini adım adım, mantıklı bir gerekçelendirme sırasıyla açıkla.
- Geçici veya kararsız yöntemlerden kaçın; en performanslı, güvenli ve projenin anayasasına en uygun yöntemi seç.

Kullanabileceğin Özel Araçlar (Tool Use):
Projedeki dosyaları incelemek için aşağıdaki metinsel araç çağrılarını yanıtında kullanabilirsin. CLI kabuğu bu çağrıları otomatik yakalayıp sonuçlarını bir sonraki turda sana getirecektir.

1. Dosya Arama: [SEARCH_FILES: kelime] -> Belirtilen kelimeye göre projedeki tüm dosyaları arar ve yollarını döner.
2. Dosya Okuma: [READ_FILE: src/components/button.tsx] -> Belirtilen dosya yolunun içeriğini döner.
3. Kısmi Dosya Okuma: [READ_FILE_LINES: src/app/page.tsx, 1-50] -> Belirtilen dosya yolunun sadece belirtilen satır aralığını döner (büyük dosyalar için mükemmeldir!).
4. Hafıza Temizleme: [FORGET_FILE: src/components/button.tsx] -> Belirtilen dosya yolunu aktif bağlam hafızasından kaldırır, böylece sonraki turlarda bağlam penceresi dolmaz.
5. Tip Kontrolü: [RUN_TYPECHECK] -> Projede 'npm run typecheck' çalıştırır ve çıktı hatalarını döner.
6. Linter Kontrolü: [RUN_LINT] -> Projede 'npm run lint' çalıştırır ve hataları döner.
7. Git Durumu: [RUN_GIT_STATUS] -> Projedeki 'git status' durumunu döner.
8. Git Değişiklikleri: [RUN_GIT_DIFF] -> Yapılan kod değişikliklerinin farkını (git diff) döner.

Mümkün olan en az adımda, ihtiyacın olan dosyaları bulup okumak için bu araçları kullan. Bilgi toplama aşamasında sadece araç çağrıları içeren kısa yanıtlar dönebilirsin. Aynı anda birden fazla arama ve okuma çağrısı yapabilirsin.

ÖNEMLİ DÖKÜMANTASYON KURALI:
Projedeki görevleri veya kodları güncellediğinde, "TASKS.md" dosyasını (görevleri [x] yaparak) ve "PROGRESS.md" dosyasını (ilerleme günlüğü, kararlar ve bir sonraki adım) güncelleyecek <write_file> veya <edit_file> etiketlerini de çözümünle birlikte otonom olarak üretmelisin. Dosya güncellemeleri ve kodlar her zaman senkronize olmalıdır.

ÖNEMLİ VERİBATANI BİLGİSİ:
Projedeki veritabanı şeması ve RLS politikalarının tek kaynağı "database/schema.snapshot.sql" dosyasıdır. Veritabanı, tablolar veya RLS hakkında bir soru geldiğinde veya kod yazarken bu dosyayı [READ_FILE_LINES: database/schema.snapshot.sql, 1-100] veya [READ_FILE] çağrısı ile okuyarak şemayı mükemmel şekilde öğrenebilirsin.

NİHAİ ÇÖZÜM RAPORU KURALI:
Tüm gerekli bilgileri topladığında, nihai çözüm raporunu hazırla.
1. Eğer yeni bir dosya oluşturmak veya bir dosyayı tamamen baştan yazmak istiyorsan, kod içeriğini MUTLAKA <write_file> etiketleri içinde ver:
<write_file path="src/components/ui/button.tsx">
// Güncel veya yeni dosya içeriğinin tamamı buraya gelecek
...
</write_file>

2. Eğer büyük bir dosyanın sadece belirli satırlarını değiştirmek istiyorsan, dosyanın tamamını üretmek yerine MUTLAKA aşağıdaki gibi kısmi düzenleme formatını kullan (SEARCH ve REPLACE blokları birebir mevcut kodla eşleşmelidir, boşluklar dahildir):
<edit_file path="src/components/ui/button.tsx">
<<<<<<< SEARCH
const oldCode = "foo";
=======
const newCode = "bar";
>>>>>>> REPLACE
</edit_file>

Her zaman temiz, tip güvenli (TypeScript strict) ve aşağıda yer alan projenin anayasal mimari kurallarına kusursuz şekilde uygun kod üret.

${constitutionRules}`;

  const messages = [
    ...getWindowedHistory(),
    { role: "user", content: (extraContext ? extraContext + "\n\n" : "") + prompt }
  ];

  // İstek süresince spinner'ı başlatıyoruz
  const spinner = startSpinner(`${cyan}Claude Netiva zekasını konuşturuyor... Lütfen bekleyin...${reset}`);

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // Her deneme için 120 saniye sınır (Gelişmiş analizler için ideal)

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.0, // Tutarlılık ve determinizm için kesinlikle sıfır sıcaklık
          max_tokens: 4000,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        let apiErrorMessage = `API Hatası (Durum Kodu: ${response.status})`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.error?.message) {
            apiErrorMessage += `: ${errorJson.error.message}`;
          }
        } catch {
          apiErrorMessage += ` - Yanıt İçeriği: ${responseText.slice(0, 500)}`;
        }
        throw new Error(sanitizeErrorOutput(apiErrorMessage));
      }

      // İlk veri akışı geldiği an spinner'ı durdurup terminale anlık akışı basıyoruz (Premium DX)
      await spinner.stop();

      let fullResponseText = "";
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") break;
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(5).trim());
              const content = json.choices?.[0]?.delta?.content || "";
              if (content) {
                process.stdout.write(content);
                fullResponseText += content;
              }
            } catch (err) {
              // Kısmi veya bozuk JSON parçacıklarını sessizce geçiyoruz
            }
          }
        }
      }

      // Akış bittiğinde satırbaşı yapalım
      process.stdout.write("\n");

      return fullResponseText;
    } catch (error) {
      if (attempt < maxRetries) {
        // Üstel geri çekilme (exponential backoff) + jitter (rastgele sapma) ile bağlantı dayanıklılığını artırıyoruz
        const delay = Math.min(10000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
        await spinner.stop();
        process.stdout.write(`\r${yellow}⚠️ Bağlantı sorunu/yoğunluk tespit edildi. ${attempt}/${maxRetries} deneme başarısız. ${(delay / 1000).toFixed(1)}sn sonra tekrar deneniyor... (Hata: ${error.message})${reset}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        process.stdout.write(`\r\x1b[K`);
        continue;
      }

      if (error.name === "AbortError") {
        console.log(`${red}❌ İstek zaman aşımına uğradı (120 saniye)!${reset}`);
        console.log(`${gray}Ayrıntı: Netiva API sunucusu istek yükü çok büyük olduğunda veya yoğunluk sırasında yanıt üretmeyi 120 saniye içinde tamamlayamadı.${reset}`);
      } else {
        const safeMsg = sanitizeErrorOutput(error.message);
        console.log(`${red}❌ İstek başarısız oldu (Tüm denemeler tükendi): ${safeMsg}${reset}`);
        if (error.stack) {
          console.log(`${gray}Hata Ayrıntısı: ${sanitizeErrorOutput(error.stack)}${reset}`);
        }
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      controller.abort(); // Memory Leak Koruması (Bug-005 Fix)
      await spinner.stop(); // Her koşulda spinner'ı durdurur
    }
  }
}

// Otonom Ajan Döngüsü (Multi-Turn Autonomous Agent Loop)
export async function runAgentLoop(initialPrompt, options = {}) {
  let currentPrompt = initialPrompt;
  let iterations = 0;
  const maxIterations = 8;
  let conversationStarted = false;

  console.log(`\n${cyan}⚡ Claude otonom analiz döngüsü başlatıldı... Lütfen bekleyin...${reset}`);
  const startTime = Date.now();

  let sessionContext = "";
  if (activeContextFiles.size > 0) {
    sessionContext += "Hafızadaki güncel dosyalar:\n";
    for (const file of activeContextFiles) {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        sessionContext += `\n--- DOSYA: ${file} ---\n${safeReadFile(fullPath)}\n`;
      }
    }
  }

  while (iterations < maxIterations) {
    iterations++;
    const response = await callClaudeRaw(currentPrompt, conversationStarted ? "" : sessionContext);
    conversationStarted = true;

    if (!response) {
      console.log(`${red}❌ Otonom analiz kesildi.${reset}`);
      return;
    }

    // Araç çağrılarını yakala
    const searchMatches = [...response.matchAll(/\[SEARCH_FILES:\s*([^\]*()\\"]+)\]/g)];
    const readMatches = [...response.matchAll(/\[READ_FILE:\s*([^\]*()\\"]+)\]/g)];
    const readLinesMatches = [...response.matchAll(/\[READ_FILE_LINES:\s*([^,\]]+),\s*(\d+)-(\d+)\]/g)];
    const forgetMatches = [...response.matchAll(/\[FORGET_FILE:\s*([^\]*()\\"]+)\]/g)];
    const typecheckMatch = response.includes("[RUN_TYPECHECK]");
    const lintMatch = response.includes("[RUN_LINT]");
    const gitStatusMatch = response.includes("[RUN_GIT_STATUS]");
    const gitDiffMatch = response.includes("[RUN_GIT_DIFF]");

    if (
      searchMatches.length === 0 &&
      readMatches.length === 0 &&
      readLinesMatches.length === 0 &&
      forgetMatches.length === 0 &&
      !typecheckMatch &&
      !lintMatch &&
      !gitStatusMatch &&
      !gitDiffMatch
    ) {
      // Araç çağrısı kalmadı, nihai yanıt alındı!
      const latency = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`${green}✓ Analiz başarıyla tamamlandı! (${latency} saniye, ${iterations} adım)${reset}\n`);
      
      console.log(`${bold}================== CLAUDE ANALİZİ & RAPORU ==================${reset}`);
      console.log(response);
      console.log(`${bold}=============================================================${reset}`);

      // Değişiklikleri kaydet ve göster
      await saveAndShowSolution(response, options);
      
      // Sohbet geçmişini güncelle ve Bellek Optimizasyonu Uygula
      conversationHistory.push({ role: "user", content: initialPrompt });
      conversationHistory.push({ role: "assistant", content: response });
      
      // Gelişmiş Bellek Koruması: Token ve Sayı Limitine Göre Prune Et
      let totalTokens = conversationHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
      while ((conversationHistory.length > MAX_HISTORY_MESSAGES * 2 || totalTokens > MAX_CONTEXT_TOKENS * 2) && conversationHistory.length > 4) {
        conversationHistory.shift();
        totalTokens = conversationHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
      }
      return;
    }

    // Araçları çalıştır ve sonuçları topla
    let toolResults = "";
    console.log(`\n${purple}${bold}🛸 Otonom Adım ${iterations}: Claude araç kullanıyor...${reset}`);

    for (const match of searchMatches) {
      const term = match[1].trim();
      console.log(`   🔎 Dosya Aranıyor: '${term}'...`);
      const allFiles = getFilesRecursively(process.cwd());
      const results = allFiles.filter(f => f.toLowerCase().includes(term.toLowerCase()));
      toolResults += `\n[SEARCH_FILES SONUCU (${term})]:\n` + (results.length > 0 ? results.slice(0, 15).join("\n") : "Eşleşen dosya bulunamadı.");
    }

    for (const match of readMatches) {
      const relPath = match[1].trim();
      console.log(`   ${bold}📖 Dosya Okunuyor: '${relPath}'...${reset}`);
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = safeReadFile(fullPath);
        toolResults += `\n[READ_FILE SONUCU (${relPath})]:\n${content}`;
        activeContextFiles.add(relPath);
      } else {
        toolResults += `\n[READ_FILE SONUCU (${relPath})]: Dosya bulunamadı!`;
      }
    }

    for (const match of readLinesMatches) {
      const relPath = match[1].trim();
      const startLine = parseInt(match[2]);
      const endLine = parseInt(match[3]);
      console.log(`   ${bold}📖 Dosya Satırları Okunuyor: '${relPath}' (Satır: ${startLine}-${endLine})...${reset}`);
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = safeReadFile(fullPath);
        const lines = content.split("\n");
        const sliced = lines.slice(Math.max(0, startLine - 1), endLine).join("\n");
        toolResults += `\n[READ_FILE_LINES SONUCU (${relPath}, ${startLine}-${endLine})]:\n${sliced}`;
        activeContextFiles.add(relPath);
      } else {
        toolResults += `\n[READ_FILE_LINES SONUCU (${relPath})]: Dosya bulunamadı!`;
      }
    }

    for (const match of forgetMatches) {
      const relPath = match[1].trim();
      console.log(`   🗑️ Dosya Hafızadan Kaldırılıyor: '${relPath}'...`);
      if (activeContextFiles.has(relPath)) {
        activeContextFiles.delete(relPath);
        toolResults += `\n[FORGET_FILE SONUCU (${relPath})]: Dosya başarıyla bağlam hafızasından kaldırıldı.`;
      } else {
        toolResults += `\n[FORGET_FILE SONUCU (${relPath})]: Dosya zaten hafızada bulunmuyordu.`;
      }
    }

    if (typecheckMatch) {
      console.log(`   🛠️ TypeScript Tip Kontrolü Çalıştırılıyor...`);
      const output = executeCommand("npm run typecheck");
      toolResults += `\n[RUN_TYPECHECK SONUCU]:\n${output}`;
    }

    if (lintMatch) {
      console.log(`   🧹 ESLint Kontrolü Çalıştırılıyor...`);
      const output = executeCommand("npm run lint");
      toolResults += `\n[RUN_LINT SONUCU]:\n${output}`;
    }

    if (gitStatusMatch) {
      console.log(`   🐙 Git Durumu Sorgulanıyor...`);
      const output = executeCommand("git status");
      toolResults += `\n[RUN_GIT_STATUS SONUCU]:\n${output}`;
    }

    if (gitDiffMatch) {
      console.log(`   🐙 Git Değişiklik Detayları Okunuyor...`);
      const output = executeCommand("git diff");
      toolResults += `\n[RUN_GIT_DIFF SONUCU]:\n${output.slice(0, 5000)}`;
    }

    currentPrompt = `[ARAÇ SONUÇLARI]:\n${toolResults}\n\nAnalizine devam et. Gerekirse başka dosyalar arayebilir, okuyabilir veya tip/linter testi çalıştırabilirsin. Hazır olduğunda nihai çözüm raporunu oluştur.`;
  }

  console.log(`${red}⚠️ Otonom analiz maksimum adım sınırına (${maxIterations}) ulaştı.${reset}`);
}

async function saveAndShowSolution(content, options = {}) {
  const { askQuestion, autoApply } = options;

  const scratchDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir);
  }

  const solutionPath = path.resolve(scratchDir, "copilot-solution.md");
  fs.writeFileSync(solutionPath, content, "utf-8");

  const changes = parseXmlFiles(content);

  console.log(`\n${green}${bold}=======================================================${reset}`);
  console.log(`${green}${bold}✓ Çözüm & Plan Raporu başarıyla kaydedildi:${reset}`);
  console.log(`${cyan}${solutionPath}${reset}`);

  if (changes.length > 0) {
    console.log(`${yellow}🛸 Önerilen Kod Değişiklikleri: ${changes.length} dosya tespit edildi.${reset}`);
    changes.forEach((c) => console.log(`   - ${cyan}${c.path}${reset}`));

    const gitStatus = executeCommand("git status --porcelain").trim();
    if (gitStatus) {
      console.log(`\n${yellow}${bold}⚠️ GÜVENLİK UYARISI: Projede commit edilmemiş aktif değişiklikler bulunmaktadır:${reset}`);
      console.log(`${gray}${gitStatus}${reset}`);
      console.log(`${yellow}Otomatik kod uygulama işlemi mevcut çalışmalarınızın üzerine yazabilir. Gerekirse 'git stash' veya commit alabilirsiniz.${reset}`);
    }

    if (autoApply) {
      applyChanges(changes);
      console.log(`${green}✓ Değişiklikler otomatik olarak başarıyla uygulandı!${reset}`);
    } else if (askQuestion) {
      const answer = await askQuestion(`\n${purple}${bold}👉 Bu değişiklikleri projeye otomatik uygulamak ister misiniz? (y/n): ${reset}`);
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        applyChanges(changes);
        console.log(`${green}✓ Değişiklikler başarıyla uygulandı!${reset}`);
      } else {
        console.log(`${gray}Değişiklikler uygulanmadı. Kodları "scratch/copilot-solution.md" dosyasından manuel inceleyebilirsiniz.${reset}`);
      }
    } else {
      console.log(`${gray}Otomatik uygulama modu aktif değil. Değişiklikleri uygulamak için "/diagnose --apply" veya "/next" kullanabilirsiniz.${reset}`);
    }
  }

  console.log(`${purple}${bold}👉 Antigravity Asistanı İçin Hazır!${reset}`);
  console.log(`${gray}Bana (Antigravity'ye) dönüp şu cümleyi yazarak tüm kodu otomatik uygulatabilirsiniz:${reset}`);
  console.log(`${bold}${cyan}"scratch/copilot-solution.md dosyasındaki çözümü projeye uygula"${reset}`);
  console.log(`${green}${bold}=======================================================${reset}\n`);
}
