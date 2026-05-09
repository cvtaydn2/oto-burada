import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Dosya listesi önbelleği (PC'yi kastırmamak ve disk I/O yükünü sıfırlamak için)
let filesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 saniye

const DEFAULT_EXCLUDES = new Set([
  "node_modules", ".next", ".git", "dist",
  "artifacts", "scratch", ".agents", ".gemini",
  "coverage", "__tests__", ".turbo", ".vercel",
  ".swc", ".cache", "build", "out",
  ".roo", ".nyc_output", "storybook-static"
]);

let exclusionsSet = null;

function getExclusions() {
  if (exclusionsSet) return exclusionsSet;
  const set = new Set(DEFAULT_EXCLUDES);
  try {
    const gitignorePath = path.resolve(process.cwd(), ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, "utf-8");
      const lines = content.split("\n");
      for (let line of lines) {
        line = line.trim();
        if (line && !line.startsWith("#")) {
          const clean = line.replace(/^\//, "").replace(/\/$/, "");
          if (clean) set.add(clean);
        }
      }
    }
  } catch (err) {
    // Sessizce geç
  }
  exclusionsSet = set;
  return set;
}

export function invalidateFilesCache() {
  filesCache = null;
  cacheTimestamp = 0;
  exclusionsSet = null;
}

const MAX_FILE_SIZE = 512 * 1024; // 512KB

export function safeReadFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      return `[DOSYA ÇOK BÜYÜK: ${(stats.size / 1024).toFixed(0)}KB > ${MAX_FILE_SIZE / 1024}KB limit]`;
    }
    const ext = path.extname(filePath).toLowerCase();
    const binaryExts = new Set([".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".zip", ".gz", ".tar", ".mp4", ".webp"]);
    if (binaryExts.has(ext)) {
      return "[BINARY DOSYA - okunamaz]";
    }
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    return `[DOSYA OKUMA HATASI]: ${err.message}`;
  }
}

// Projedeki tüm dosyaları tarayan recursive fonksiyon (Güvenli, Önbellekli & Optimize)
export function getFilesRecursively(dir, files = [], useCache = true) {
  const now = Date.now();
  if (useCache && filesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return [...filesCache];
  }

  const exclusions = getExclusions();

  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const list = fs.readdirSync(currentDir);
    for (const file of list) {
      if (exclusions.has(file)) continue;
      const fullPath = path.join(currentDir, file);
      try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) continue;

        if (stat.isDirectory()) {
          scan(fullPath);
        } else {
          files.push(path.relative(process.cwd(), fullPath).replace(/\\/g, "/"));
        }
      } catch (e) {
        continue;
      }
    }
  }

  scan(dir);

  if (useCache) {
    filesCache = [...files];
    cacheTimestamp = now;
  }
  return [...files];
}

// XML Bloklarını Ayrıştırma (Süreçte hem tüm dosya hem de SEARCH/REPLACE bloklarını ayrıştırır)
export function parseXmlFiles(content) {
  const changes = [];

  // 1. Tam Dosya Yazma Blokları (<write_file>)
  const fileRegex = /<write_file\s+path="([^"]+)">([\s\S]*?)<\/write_file>/g;
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    const filePath = match[1].trim();
    const fileCode = match[2];
    changes.push({ path: filePath, code: fileCode });
  }

  // 2. Kısmi Düzenleme Blokları (<edit_file>)
  const editRegex = /<edit_file\s+path="([^"]+)">([\s\S]*?)<\/edit_file>/g;
  let editMatch;
  while ((editMatch = editRegex.exec(content)) !== null) {
    const filePath = editMatch[1].trim();
    const blockContent = editMatch[2];

    const searchReplaceRegex = /<<<<<<< SEARCH([\s\S]*?)=======([\s\S]*?)>>>>>>> REPLACE/g;
    let subMatch;
    const chunks = [];
    while ((subMatch = searchReplaceRegex.exec(blockContent)) !== null) {
      chunks.push({
        search: subMatch[1],
        replace: subMatch[2]
      });
    }

    if (chunks.length > 0) {
      changes.push({ path: filePath, chunks });
    }
  }

  return changes;
}

// Dosyaları Fiziksel Olarak Güncelleme (Güvenli Yol Kontrolü ve Kısmi Güncelleme Desteği)
export function applyChanges(changes) {
  const cwd = path.resolve(process.cwd());

  for (const change of changes) {
    const fullPath = path.resolve(cwd, change.path);
    const relative = path.relative(cwd, fullPath);
    
    // Güvenlik Kontrolü: Güçlendirilmiş Path Traversal Koruması (Relative Escape Engelleme)
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Güvenlik İhlali: Belirtilen dosya yolu proje sınırları dışındadır! Hedef: ${change.path}`);
    }

    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (change.code !== undefined) {
      // Tam dosya yazma işlemi
      fs.writeFileSync(fullPath, change.code, "utf-8");
    } else if (change.chunks && change.chunks.length > 0) {
      // Kısmi SEARCH/REPLACE düzenleme işlemi
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Hata: Düzenlenmek istenen dosya bulunamadı! Yol: ${change.path}`);
      }
      let fileContent = fs.readFileSync(fullPath, "utf-8");
      for (const chunk of change.chunks) {
        if (!fileContent.includes(chunk.search)) {
          throw new Error(`Hata: '${change.path}' dosyasında aranacak kısım bulunamadı. Lütfen birebir eşleşme sağlandığından emin olun.\nAranan Kısım:\n${chunk.search}`);
        }
        fileContent = fileContent.replace(chunk.search, chunk.replace);
      }
      fs.writeFileSync(fullPath, fileContent, "utf-8");
    }
  }
  // Dosyalar güncellendiğinde önbelleği temizle
  invalidateFilesCache();
}

// XML Bloklarını Ayrıştırma ve Dosyaları Fiziksel Olarak Güncelleme (Geriye Uyumlu)
export function parseAndApplyXmlFiles(content) {
  const changes = parseXmlFiles(content);
  applyChanges(changes);
  return changes;
}

// Güvenli argüman ayrıştırma (Çift tırnakları korur)
function parseCommandArgs(cmdStr) {
  const args = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < cmdStr.length; i++) {
    const char = cmdStr[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current) {
    args.push(current);
  }
  return args;
}

// Güvenli Komut Çalıştırıcı (Beyaz Liste Kontrolü & Çıktı Kırpıcı)
export function executeCommand(cmd) {
  const trimmedCmd = cmd.trim();
  const tokens = parseCommandArgs(trimmedCmd);
  if (tokens.length === 0) {
    return "Hata: Geçersiz boş komut.";
  }

  const rootExe = tokens[0].toLowerCase();
  
  // Tam eşleşme doğrulaması (Kritik Güvenlik Kontrolü)
  let isAllowed = false;
  if (["git", "node", "ls", "dir"].includes(rootExe)) {
    isAllowed = true;
  } else if (rootExe === "npm" && tokens.length > 1) {
    const subAction = tokens[1].toLowerCase();
    if (subAction === "run" || subAction === "test") {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
    const warning = `[GÜVENLİK İHLALİ]: '${cmd}' komutunun çalıştırılmasına izin verilmedi. Sadece izin verilen komutlar (git, npm run, npm test, node, ls, dir) çalıştırılabilir.`;
    console.error(`\n❌ ${warning}`);
    return warning;
  }

  try {
    const exe = tokens[0];
    const args = tokens.slice(1);
    
    // Windows üzerinde npm, ls, dir gibi komutların çalışması için shell gerekir
    const useShell = process.platform === "win32" || ["npm", "ls", "dir"].includes(rootExe);
    
    const result = spawnSync(exe, args, {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: 45000, // Bazen 'npm run typecheck' uzun sürebilir
      shell: useShell
    });

    let output = result.stdout || result.stderr || "";
    if (output.length > 3000) {
      output = output.slice(0, 3000) + "\n\n[... Çıktı çok uzun olduğu için ilk 3000 karakterle sınırlandırılmıştır ...]";
    }
    return output;
  } catch (err) {
    let output = err.message || "";
    if (output.length > 3000) {
      output = output.slice(0, 3000) + "\n\n[... Hata çıktısı çok uzun olduğu için ilk 3000 karakterle sınırlandırılmıştır ...]";
    }
    return output;
  }
}
