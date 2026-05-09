import fs from "node:fs";
import path from "node:path";
import { reset, bold, cyan, green, yellow, gray } from "./colors.mjs";

const MEMORY_DIR = ".agents/memory";
const MEMORY_FILE = "decisions.json";
const MAX_MEMORIES = 50;

function getMemoryPath() {
  return path.resolve(process.cwd(), MEMORY_DIR, MEMORY_FILE);
}

function ensureMemoryDir() {
  const dir = path.resolve(process.cwd(), MEMORY_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Yeni bir karar/öğrenme kaydet
 */
export function saveMemory(entry) {
  ensureMemoryDir();
  const memPath = getMemoryPath();

  let data = loadAllMemories();

  const newEntry = {
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    category: entry.category || "general",
    task: entry.task || "",
    decision: entry.decision || "",
    files_affected: entry.files_affected || [],
    tags: entry.tags || [],
  };

  data.push(newEntry);

  if (data.length > MAX_MEMORIES) {
    data = data.slice(data.length - MAX_MEMORIES);
  }

  fs.writeFileSync(memPath, JSON.stringify(data, null, 2), "utf-8");
  return newEntry;
}

/**
 * Tüm hafızayı yükle
 */
export function loadAllMemories() {
  const memPath = getMemoryPath();
  if (!fs.existsSync(memPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(memPath, "utf-8"));
  } catch {
    return [];
  }
}

/**
 * Göreve göre ilgili hafıza kayıtlarını bul (basit keyword match)
 */
export function recallRelevantMemories(task, maxResults = 5) {
  const all = loadAllMemories();
  if (!all.length) return [];

  const keywords = task
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const scored = all.map((entry) => {
    const text = `${entry.task} ${entry.decision} ${entry.tags.join(" ")}`.toLowerCase();
    const score = keywords.filter((kw) => text.includes(kw)).length;
    return { ...entry, score };
  });

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || b.id - a.id)
    .slice(0, maxResults);
}

/**
 * Hafızayı agent prompt'una inject et
 */
export function buildMemoryContext(task) {
  const relevant = recallRelevantMemories(task);
  if (!relevant.length) return "";

  let ctx = "\n=== GEÇMİŞ KARARLAR & ÖĞRENMELER ===\n";
  ctx += "Bu projeyle ilgili daha önce alınan kararlar:\n\n";

  for (const mem of relevant) {
    ctx += `[${mem.date}] [${mem.category.toUpperCase()}] ${mem.task}\n`;
    ctx += `→ Karar: ${mem.decision}\n`;
    if (mem.files_affected.length) {
      ctx += `→ Etkilenen: ${mem.files_affected.join(", ")}\n`;
    }
    ctx += "\n";
  }
  ctx += "=".repeat(40) + "\n";
  return ctx;
}

/**
 * Copilot çıktısından otomatik hafıza çıkar
 */
export function extractAndSaveMemoriesFromResponse(response, taskDescription) {
  const decisionPatterns = [
    /Decision:\s*(.+)/gi,
    /Karar:\s*(.+)/gi,
    /Tercih:\s*(.+)/gi,
    /Mimari Not:\s*(.+)/gi,
  ];

  const decisions = [];
  for (const pattern of decisionPatterns) {
    const matches = [...response.matchAll(pattern)];
    decisions.push(...matches.map((m) => m[1].trim()));
  }

  if (decisions.length > 0) {
    for (const decision of decisions.slice(0, 3)) {
      saveMemory({
        category: "decision",
        task: taskDescription.slice(0, 100),
        decision: decision.slice(0, 300),
        tags: taskDescription
          .toLowerCase()
          .split(/\s+/)
          .slice(0, 5),
      });
    }
    console.log(`${green}💾 ${decisions.length} yeni karar hafızaya kaydedildi.${reset}`);
  }
}

/**
 * Terminal'de hafızayı göster
 */
export function printMemorySummary() {
  const all = loadAllMemories();
  if (!all.length) {
    console.log(`${yellow}💭 Henüz kaydedilmiş hafıza yok.${reset}`);
    return;
  }

  console.log(`\n${bold}╔══════════════════════════════════════╗${reset}`);
  console.log(`${bold}║     🧠 COPILOT HAFIZA (${all.length} kayıt)     ║${reset}`);
  console.log(`${bold}╚══════════════════════════════════════╝${reset}`);

  const recent = all.slice(-10).reverse();
  for (const mem of recent) {
    console.log(
      `${gray}[${mem.date}]${reset} ${cyan}${mem.category.toUpperCase()}${reset} — ${(mem.task || "").slice(0, 60)}`
    );
    console.log(`         ${(mem.decision || "").slice(0, 80)}...`);
  }
  console.log(`${bold}══════════════════════════════════════${reset}\n`);
}