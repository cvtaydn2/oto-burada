// scripts/copilot/planner.mjs
import { callClaudeRaw } from "./agent.mjs";
import { reset, bold, cyan, green, yellow, purple, gray } from "./colors.mjs";

/**
 * Planner Agent — Görev Ayrıştırıcı
 * Kullanıcı isteğini alt görevlere böler, hangi uzmanların çalışacağını ve
 * hangi dosyaların okunması gerektiğini belirler.
 * Çıktısı doğrudan swarm orchestrator'a ve agent loop'a beslenir.
 */
export async function runPlanner(userTask, projectContext = "") {
  console.log(`\n${cyan}${bold}🗺️  Planner Agent görevi analiz ediyor...${reset}`);

  const plannerPrompt = `
Sen bir Planner Ajanısın. Sana verilen görevi analiz edecek ve bir uygulama planı üreteceksin.

GÖREV:
${userTask}

PROJE BAĞLAMI:
${projectContext.slice(0, 3000)}

Lütfen sadece aşağıdaki JSON formatında cevap ver, başka hiçbir şey yazma:

{
  "task_summary": "Görevin 1-2 cümlelik özeti",
  "complexity": "low|medium|high",
  "needs_specialists": true|false,
  "specialists_needed": ["BACKEND", "FRONTEND", "QA"],
  "subtasks": [
    { "id": 1, "title": "Kısa görev adı", "owner": "BACKEND|FRONTEND|PLANNER", "depends_on": [] },
    { "id": 2, "title": "...", "owner": "FRONTEND", "depends_on": [1] }
  ],
  "files_to_read": [
    "src/app/...",
    "database/schema.snapshot.sql"
  ],
  "risks": ["Olası risk 1", "Olası risk 2"],
  "estimated_api_calls": 3
}

Kurallar:
- subtasks maksimum 5 madde olsun
- files_to_read sadece gerçekten okunması gereken dosyaları listele (max 5)
- complexity "low" ise needs_specialists false olabilir
- Her zaman JSON döndür, açıklama ekleme
`;

  const raw = await callClaudeRaw(plannerPrompt, "", null, { temperature: 0.0 });
  if (!raw) return null;

  let plan = null;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      plan = JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.log(`${yellow}⚠️ Planner JSON parse hatası.${reset}`);
    return null;
  }

  if (!plan) return null;

  console.log(`\n${bold}╔══════════════════════════════════════════╗${reset}`);
  console.log(`${bold}║          🗺️  GÖREV PLANI (PLANNER)       ║${reset}`);
  console.log(`${bold}╚══════════════════════════════════════════╝${reset}`);
  console.log(`${cyan}Özet:${reset}       ${plan.task_summary}`);
  console.log(
    `${cyan}Karmaşıklık:${reset} ${
      plan.complexity === "high"
        ? `${yellow}Yüksek${reset}`
        : plan.complexity === "medium"
          ? `${cyan}Orta${reset}`
          : `${green}Düşük${reset}`
    }`
  );
  console.log(`${cyan}Uzmanlar:${reset}   ${(plan.specialists_needed || []).join(" → ")}`);

  if (plan.subtasks?.length) {
    console.log(`\n${bold}Alt Görevler:${reset}`);
    for (const sub of plan.subtasks) {
      const dep = sub.depends_on?.length ? ` (önce: #${sub.depends_on.join(", #")})` : "";
      console.log(`  ${purple}${sub.id}.${reset} [${sub.owner}] ${sub.title}${gray}${dep}${reset}`);
    }
  }

  if (plan.files_to_read?.length) {
    console.log(`\n${bold}Okunacak Dosyalar:${reset}`);
    plan.files_to_read.forEach((f) => console.log(`  📖 ${cyan}${f}${reset}`));
  }

  if (plan.risks?.length) {
    console.log(`\n${bold}Riskler:${reset}`);
    plan.risks.forEach((r) => console.log(`  ${yellow}⚠️ ${r}${reset}`));
  }

  console.log(`\n${gray}Tahmini API çağrısı: ~${plan.estimated_api_calls}${reset}`);
  console.log(`${bold}══════════════════════════════════════════${reset}\n`);

  return plan;
}

/**
 * Planner çıktısından agent loop için zenginleştirilmiş prompt üretir
 */
export function enrichPromptWithPlan(originalPrompt, plan) {
  if (!plan) return originalPrompt;

  const fileReadCmds = (plan.files_to_read || []).map((f) => `[READ_FILE: ${f}]`).join("\n");

  return `${originalPrompt}

=== PLANNER GÖREV PLANI ===
Özet: ${plan.task_summary}
Alt Görevler:
${(plan.subtasks || []).map((s) => `- [${s.owner}] ${s.title}`).join("\n")}

Riskler: ${(plan.risks || []).join(", ") || "Yok"}

BAŞLAMADAN ÖNCE şu dosyaları oku:
${fileReadCmds}
===========================`;
}