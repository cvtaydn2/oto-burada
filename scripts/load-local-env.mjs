import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadNodeEnvFile(filePath) {
  if (typeof process.loadEnvFile === "function" && fs.existsSync(filePath)) {
    process.loadEnvFile(filePath);
    return true;
  }

  return false;
}

function loadFallbackEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const raw = fs.readFileSync(filePath, "utf8");

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });

  return true;
}

export function loadLocalEnv() {
  const cwd = process.cwd();
  const envPaths = [path.resolve(cwd, ".env.local"), path.resolve(cwd, ".env")];

  envPaths.forEach((filePath) => {
    if (!loadNodeEnvFile(filePath)) {
      loadFallbackEnvFile(filePath);
    }
  });
}
