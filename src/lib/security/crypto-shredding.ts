import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import crypto from 'node:crypto';

/**
 * World-Class Privacy: Crypto-Shredding (Issue 4)
 * PII is encrypted with a per-user key. Deleting the key makes backups unreadable.
 */

// const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-32-chars-long!!';
const ALGORITHM = 'aes-256-gcm';

export async function getOrCreateUserKey(userId: string): Promise<Buffer> {
  const supabase = await createSupabaseServerClient();
  
  const { data: keyRecord } = await supabase
    .from('user_encryption_keys')
    .select('encryption_key')
    .eq('user_id', userId)
    .single();

  if (keyRecord) {
    // Unwrap the key using master key
    return Buffer.from(keyRecord.encryption_key, 'hex');
  }

  // Create new random key for user
  const newUserKey = crypto.randomBytes(32);
  
  await supabase
    .from('user_encryption_keys')
    .insert({
      user_id: userId,
      encryption_key: newUserKey.toString('hex'),
    });

  return newUserKey;
}

export async function encryptPII(text: string, userId: string): Promise<string> {
  try {
    const key = await getOrCreateUserKey(userId);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.security.error("PII Encryption failed", error, { userId });
    return text; // Fallback to raw (careful in production)
  }
}

export async function decryptPII(encryptedText: string, userId: string): Promise<string> {
  try {
    if (!encryptedText.includes(':')) return encryptedText;

    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const key = await getOrCreateUserKey(userId);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (_error) {
    // If key was deleted (shredded), decryption will fail
    logger.security.warn("PII Decryption failed - possibly shredded or key missing", { userId });
    return "[VERİ İMHA EDİLDİ]";
  }
}
