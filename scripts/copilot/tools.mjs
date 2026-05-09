import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// Dosya listesi önbelleği (PC'yi kastırmamak ve disk I/O yükünü sıfırlamak için)
let filesCache = null;

export function invalidateFilesCache() {
  filesCache = null;
}

// Projedeki tüm dosyaları tarayan recursive fonksiyon (Güvenli, Önbellekli & Optimize)
export function getFilesRecursively(dir, files = [], useCache = true) {
  if (useCache && filesCache) {
    return [...filesCache];
  }

  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (
      file === "node_modules" ||
      file === ".next" ||
      file === ".git" ||
      file === "dist" ||
      file === "artifacts" ||
      file === "scratch" ||
      file === ".agents" ||
      file === ".gemini"
    ) {
      continue;
    }
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) continue; // Symlink döngülerine karşı koruma

      if (stat.isDirectory()) {
        getFilesRecursively(fullPath, files, false);
      } else {
        files.push(path.relative(process.cwd(), fullPath).replace(/\\/g, "/"));
      }
    } catch (e) {
      // Hata durumunda dosyayı atla (Örn: Erişim izin hataları)
      continue;
    }
  }

  if (useCache) {
    filesCache = [...files];
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

// Güvenli Komut Çalıştırıcı (Beyaz Liste Kontrolü & Çıktı Kırpıcı)
export function executeCommand(cmd) {
  // Gelişmiş Güvenlik Kontrolü: Kabuk Enjeksiyonu Metakarakterlerini Engelleme
  const shellMetachars = [";", "&&", "||", "|", "`", "$", "<", ">", "\n", "\r"];
  for (const char of shellMetachars) {
    if (cmd.includes(char)) {
      const warning = `[GÜVENLİK İHLALİ]: '${cmd}' komutunda kabuk enjeksiyonuna neden olabilecek metakarakterler tespit edildi ('${char}').`;
      console.error(`\n❌ ${warning}`);
      return warning;
    }
  }

  const trimmedCmd = cmd.trim();
  const tokens = trimmedCmd.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return "Hata: Geçersiz boş komut.";
  }

  const rootExe = tokens[0].toLowerCase();
  
  // Tam eşleşme doğrulaması
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
    let output = execSync(cmd, { stdio: "pipe", encoding: "utf-8" }) || "";
    if (output.length > 3000) {
      output = output.slice(0, 3000) + "\n\n[... Çıktı çok uzun olduğu için ilk 3000 karakterle sınırlandırılmıştır ...]";
    }
    return output;
  } catch (err) {
    let output = err.stdout || err.stderr || err.message || "";
    if (output.length > 3000) {
      output = output.slice(0, 3000) + "\n\n[... Hata çıktısı çok uzun olduğu için ilk 3000 karakterle sınırlandırılmıştır ...]";
    }
    return output;
  }
}
