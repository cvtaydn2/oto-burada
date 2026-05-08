import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function getIdentityKey(): string {
  return (
    process.env.IDENTITY_ENCRYPTION_KEY ||
    process.env.IYZICO_IDENTITY_ENCRYPTION_KEY ||
    process.env.IYZICO_SECRET_KEY ||
    ""
  );
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function maskIdentityNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (normalized.length < 4) return "***********";
  return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
}

export function encryptIdentityNumber(raw: string): string {
  const secret = getIdentityKey();
  if (!secret) return raw;

  const iv = randomBytes(12);
  const key = deriveKey(secret);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptIdentityNumber(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;

  const secret = getIdentityKey();
  if (!secret) return null;

  const payload = stored.slice(PREFIX.length).split(":");
  if (payload.length !== 3) return null;

  const [ivB64, tagB64, encryptedB64] = payload;
  try {
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const encrypted = Buffer.from(encryptedB64, "base64");
    const key = deriveKey(secret);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
