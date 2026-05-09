import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// Dosya listesi önbelleği (PC'yi kastırmamak ve disk I/O yükünü sıfırlamak için)
let filesCache = null;

export function invalidateFilesCache() {
  filesCache = null;
}

// Projedeki tüm dosyaları tarayan recursive fonksiyon (Önbellekli & Optimize)
export function getFilesRecursively(dir, files = [], useCache = true) {
  if (useCache && filesCache) {
    return filesCache;
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
    if (fs.statSync(fullPath).isDirectory()) {
      getFilesRecursively(fullPath, files, false);
    } else {
      files.push(path.relative(process.cwd(), fullPath).replace(/\\/g, "/"));
    }
  }

  if (useCache) {
    filesCache = files;
  }
  return files;
}

// XML Bloklarını Ayrıştırma ve Dosyaları Fiziksel Olarak Güncelleme (Tam Otonom)
export function parseAndApplyXmlFiles(content) {
  const fileRegex = /<write_file\s+path="([^"]+)">([\s\S]*?)<\/write_file>/g;
  let match;
  const changes = [];

  while ((match = fileRegex.exec(content)) !== null) {
    const filePath = match[1].trim();
    const fileCode = match[2];
    changes.push({ path: filePath, code: fileCode });

    // Dosyayı fiziksel olarak diske yaz
    const fullPath = path.resolve(process.cwd(), filePath);
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(fullPath, fileCode, "utf-8");

    // Dosya yazıldığında veya güncellendiğinde önbelleği temizle
    invalidateFilesCache();
  }

  return changes;
}

// Güvenli Komut Çalıştırıcı (Büyük hata çıktılarını kırpıp token limitini korur)
export function executeCommand(cmd) {
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
