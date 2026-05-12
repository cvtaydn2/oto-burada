import fs from "node:fs";
import path from "node:path";
import { runAgentLoop } from "./agent.mjs";
import { reset, bold, blue, purple, green, cyan, yellow, red, gray } from "./colors.mjs";
import { executeCommand } from "./tools.mjs";
import { runPlanner, enrichPromptWithPlan } from "./planner.mjs";

export async function handleConstitutionalReview(options = {}) {
  console.log(`\n${cyan}🛡️  Anayasal Kod Denetimi Çalıştırılıyor...${reset}`);
  let gitDiffOutput = executeCommand("git diff").trim();
  if (!gitDiffOutput) {
    console.log(`${yellow}💡 Değişiklik tespit edilmedi. Son yapılan commit inceleniyor...${reset}`);
    gitDiffOutput = executeCommand("git diff HEAD~1").trim();
  }

  if (!gitDiffOutput) {
    console.log(`${yellow}⚠️ İncelenecek aktif bir kod değişikliği bulunamadı.${reset}`);
    return;
  }

  const prompt = `Aşağıdaki kod değişikliklerini (git diff) .agents/rules dizinindeki mimari, güvenlik, frontend ve backend anayasa kuralları ile karşılaştırarak incele.
Kurallara aykırı veya uyumsuz bir pratik var mı? (Örn: RLS eksikliği, class-based servis kullanımı, any tip ataması, mobile-first UX ihlali vb.)
Bulduğun aykırılıkları ve riskleri listele ve bunları düzeltmek için güncel dosyaları <write_file> etiketleri içinde üret.

Kod Değişiklikleri:
${gitDiffOutput}`;

  await runAgentLoop(prompt, options);
}

export async function handleNextTaskSolver(options = {}) {
  console.log(`\n${cyan}🎯 Otonom Görev Çözücü Başlatılıyor...${reset}`);

  // Güvenli Başlatma: Temel planlama dosyalarını doğrudan hafızaya ekle
  const { activeContextFiles } = await import("./config.mjs");
  activeContextFiles.add("TASKS.md");
  activeContextFiles.add("PROGRESS.md");
  activeContextFiles.add("README.md");

  const basePrompt = `Sıradaki görevi tespit etmek için önce projedeki TASKS.md ve PROGRESS.md dosyalarını [READ_FILE] ile oku.
Yapılması gereken bir sonraki en kritik görevi tespit et. Görevin kapsamını anla, ilgili dosyaları projede arat [SEARCH_FILES] ve içeriklerini oku [READ_FILE].
Görevin otonom kodlamasını ve mimari çözümünü kusursuzca yapıp, oluşturulacak veya güncellenecek dosyaları <write_file> etiketleri içinde tam sürüm olarak sun.
Ayrıca "TASKS.md" ve "PROGRESS.md" dosyalarını da güncelleyerek çözümünün bir parçası olarak sun.`;

  const plan = await runPlanner('TASKS.md\'den sonraki en kritik görevi bul ve çöz');
  const enrichedPrompt = enrichPromptWithPlan(basePrompt, plan);
  await runAgentLoop(enrichedPrompt, options);
}

export async function handleSchemaExplorer(options = {}) {
  console.log(`\n${cyan}💾 Veritabanı Şeması & RLS Rehberi Hazırlanıyor...${reset}`);
  const prompt = `Projenin veri yapısını anlamak için database/schema.snapshot.sql dosyasını [READ_FILE: database/schema.snapshot.sql] çağrısı ile oku.
Geliştiriciye projedeki mevcut veritabanı tablolarını, alanlarını, foreign key ilişkilerini ve kurulu olan Row Level Security (RLS) politikalarını içeren temiz, okunması kolay bir şema özeti sun.`;

  await runAgentLoop(prompt, options);
}

export async function handleConflictResolver(options = {}) {
  console.log(`\n${cyan}⚔️  Otonom Çatışma Çözücü (Conflict Resolver) Başlatılıyor...${reset}`);
  const unmergedFiles = executeCommand("git diff --name-only --diff-filter=U").trim();

  if (!unmergedFiles) {
    console.log(`${green}✓ Harika! Projede şu an aktif çakışma (merge conflict) bulunmuyor.${reset}`);
    return;
  }

  console.log(`${yellow}⚠️ Çakışma olan dosyalar tespit edildi:\n${unmergedFiles}${reset}`);
  const prompt = `Projede şu an aktif merge conflict (çakışma) durumları bulunmaktadır.
Aşağıdaki çakışmalı dosyaları sırayla [READ_FILE] ile oku. Dosyalardaki <<<<<<<, =======, >>>>>>> etiketlerini ve çakışan kod bloklarını tespit et.
Git geçmişini, kurallarimizi ve iki tarafın niyetini analiz ederek çakışmaları en doğru şekilde çöz.
Çözülen dosyaların tam hallerini <write_file> etiketleri içinde sun.`;

  await runAgentLoop(prompt, options);
}

export async function handleSkillWriter(skillName, options = {}) {
  const prompt = `Proje standartlarına uygun yeni bir Agent Skill tasarlamak veya mevcut bir beceriyi denetlemek istiyoruz.
Skill adı: "${skillName}"
.roo/ veya .agents/ altındaki beceri şablonlarını ve kurallarını göz önünde bulundurarak, bu beceri için mükemmel bir SKILL.md rehberi ve gerekirse yardımcı scriptler tasarla.
Geliştirici yönergelerini, ne zaman kullanılacağını ve tamamlanma kriterlerini içeren tam dökümanı <write_file> etiketleri içinde sun.`;

  await runAgentLoop(prompt, options);
}

export async function handleOrchestra(userPrompt, options = {}) {
  console.log(`\n${cyan}🎻 Tam Döngü Proje Orkestrasyonu (Orchestra Mode) Başlatılıyor...${reset}`);
  console.log(`${gray}Orkestratör sırasıyla: Planlayacak -> Çözümü kodlayacak -> Linter/Typecheck ile doğrulayacak -> Dökümanları güncelleyecek!${reset}`);

  // Güvenli Başlatma: Temel planlama dosyalarını doğrudan hafızaya ekle
  const { activeContextFiles } = await import("./config.mjs");
  activeContextFiles.add("TASKS.md");
  activeContextFiles.add("PROGRESS.md");
  activeContextFiles.add("README.md");

  const taskForPlanner = userPrompt?.trim() || "TASKS.md'den sonraki görevi çöz";
  const plan = await runPlanner(taskForPlanner);

  let dynamicDirective = "";
  if (userPrompt && userPrompt.trim()) {
    console.log(`${yellow}📌 Kullanıcı Talimatı Alındı: ${bold}"${userPrompt.trim()}"${reset}`);
    dynamicDirective = `\n⚠️ DİKKAT - ÖNCELİKLİ GÖREV: Kullanıcı senden doğrudan şu görevi tamamlamanı istiyor: "${userPrompt.trim()}". TASKS.md'ye bakmadan önce İLK OLARAK bu talebi yerine getir. Kodlama bittikten sonra dökümanları bu değişikliğe göre güncelle.\n`;
  }

  const basePrompt = `Sen tam döngü çalışan bir Orkestra Ajanısın. Lütfen şu adımları tamamen otonom olarak sırasıyla yürüt:${dynamicDirective}
1. TASKS.md ve PROGRESS.md dosyalarını [READ_FILE] ile oku ve sıradaki tamamlanmamış en kritik görevi bul. (Kullanıcı doğrudan bir talimat verdiyse onu önceliklendir).
2. Görevin kapsamındaki ilgili dosyaları projede arat [SEARCH_FILES] ve içeriklerini oku [READ_FILE].
3. Görevin otonom kodlamasını anayasa kurallarına kusursuz uygun şekilde tamamla.
4. Kod bittikten sonra [RUN_LINT] ve [RUN_TYPECHECK] araçlarını çağırarak kodun doğruluğunu otonom test et. Eğer tip veya linter hatası alırsan, kodunu düzeltip temiz çıktıyı görene kadar döngüye devam et (Self-Healing).
5. Değişiklikler bittiğinde, TASKS.md dosyasında ilgili görevi tamamlandı [x] olarak işaretle ve PROGRESS.md dosyasını tamamlanan adımlar, alınan kararlar, doğrulamalar ve bir sonraki adım bilgiyle güncelle.
6. Hem güncellenen kod dosyalarını hem de güncellenen TASKS.md ile PROGRESS.md dosyalarını <write_file> etiketleri içinde tam sürüm olarak sun.`;

  const enrichedPrompt = enrichPromptWithPlan(basePrompt, plan);
  await runAgentLoop(enrichedPrompt, options);
}

export async function handleSelfDiagnose(options = {}) {
  console.log(`\n${purple}${bold}🔍 Kendi Kendini Teşhis & Tarama Modu (Self-Diagnose) Başlatıldı...${reset}`);
  console.log(`${gray}Copilot aracı otonom olarak kendi kaynak kodlarını inceleyecek...${reset}`);

  // Dinamik path keşfi: scripts/copilot dizinindeki mevcut dosyaları bul
  const agentDir = path.resolve(import.meta.url.replace('file://', ''), '..', 'copilot');
  const selfFiles = [];
  try {
    const files = fs.readdirSync(agentDir);
    for (const file of files.sort()) {
      if (file.endsWith('.mjs') && file !== 'index.mjs') {
        selfFiles.push(`scripts/copilot/${file}`);
      }
    }
  } catch {
    selfFiles.push('scripts/copilot/agent.mjs', 'scripts/copilot/commands.mjs', 'scripts/copilot/tools.mjs');
  }

  const prompt = `Sen Copilot aracının kendi kendini denetleyen Teşhis ve Tarama Ajanısın (Claude Opus 4.6).
Şu anda üzerinde çalıştığın Copilot uygulamasının tüm kaynak kod dosyaları sistemdedir:
${selfFiles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Senden beklentimiz: 
1. Bu dosyaları otonom olarak [READ_FILE: scripts/copilot/...] araç çağrısıyla TOPLU HALDE (tek seferde birden fazla komut yazarak) okuyarak incele.
2. Kaynak kodlardaki olası mantıksal hataları (bugs), eksik hata yakalama bloklarını (error handling), asenkron yönetim eksikliklerini ve performans darboğazlarını analiz et.
3. Bulduğun kritik eksikleri düzeltmek veya araca yeni yetenekler kazandırmak için güncel kodları <write_file> etiketleri içinde tam sürüm olarak üret veya detaylı bir rapor sun.

Analizine başlamak için öncelikle incelemek istediğin tüm dosyaları toplu halde [READ_FILE: ...] formatındaki komutlarla alt alta oku.`;

  await runAgentLoop(prompt, options);
}

export async function handleSemanticCommit(options = {}) {
  const { askQuestion, autoApply } = options;
  console.log(`\n${cyan}🐙 Semantik Commit Mesajı Üretici Başlatılıyor...${reset}`);

  let gitDiffOutput = executeCommand("git diff").trim();
  if (!gitDiffOutput) {
    gitDiffOutput = executeCommand("git diff --cached").trim();
  }

  if (!gitDiffOutput) {
    console.log(`${yellow}⚠️ Commit edilecek aktif bir değişiklik bulunamadı.${reset}`);
    return;
  }

  const prompt = `Aşağıdaki git diff değişikliklerini incele ve Conventional Commits (Semantic Commits) standartlarına uygun mükemmel bir commit mesajı üret.
Mesaj şu formatta olmalıdır:
<tip>(<kapsam>): <kısa açıklama>

Örn: feat(copilot): add multi-select and auto-fix capabilities

Commit Tipleri: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.

Sadece tek bir satırda commit mesajını dön, başka hiçbir açıklama veya markdown bloğu kullanma.

Değişiklikler:
${gitDiffOutput.slice(0, 4000)}`;

  const { callClaudeRaw } = await import("./agent.mjs");
  const commitMessage = (await callClaudeRaw(prompt))?.trim();

  if (!commitMessage) {
    console.log(`${red}❌ Commit mesajı üretilemedi.${reset}`);
    return;
  }

  console.log(`\n${green}${bold}🛸 Önerilen Semantik Commit Mesajı:${reset}`);
  console.log(`${cyan}${bold}${commitMessage}${reset}`);

  if (autoApply) {
    executeCommand("git add -A");
    executeCommand(`git commit -m "${commitMessage}"`);
    console.log(`${green}✓ Değişiklikler başarıyla commitleştirildi!${reset}`);
  } else if (askQuestion) {
    const answer = await askQuestion(`\n${purple}${bold}👉 Bu commit mesajını onaylayıp değişiklikleri kaydetmek ister misiniz? (y/n): ${reset}`);
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      executeCommand("git add -A");
      executeCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      console.log(`${green}✓ Değişiklikler başarıyla commitleştirildi!${reset}`);
    } else {
      console.log(`${gray}Commit işlemi iptal edildi.${reset}`);
    }
  } else {
    console.log(`${gray}Commit mesajı sadece görüntülendi.${reset}`);
  }
}
