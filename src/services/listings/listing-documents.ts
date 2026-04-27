import {
  expertDocumentAcceptedMimeTypes,
  expertDocumentMaxSizeInBytes,
} from "@/lib/constants/domain";

const mimeTypeSet = new Set<string>(expertDocumentAcceptedMimeTypes);

const MAGIC_BYTES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

export function formatFileSize(sizeInBytes: number) {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function getExpertDocumentConstraintsText() {
  const acceptedTypes = expertDocumentAcceptedMimeTypes
    .map((mimeType) => mimeType.replace("image/", "").replace("application/", "").toUpperCase())
    .join(", ");

  return `${acceptedTypes} formati, en fazla ${formatFileSize(expertDocumentMaxSizeInBytes)}`;
}

export function getExpertDocumentMaxUploadBytes() {
  return expertDocumentMaxSizeInBytes;
}

async function readFileHeader(file: File): Promise<number[]> {
  const buffer = await file.slice(0, 4).arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}

function matchesMagicBytes(header: number[], magicBytes: number[]): boolean {
  return magicBytes.every((byte, index) => header[index] === byte);
}

async function validateMagicBytes(file: File): Promise<boolean> {
  const header = await readFileHeader(file);

  for (const magicBytes of Object.values(MAGIC_BYTES)) {
    if (matchesMagicBytes(header, magicBytes)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the verified MIME type from magic bytes, or null if unrecognized.
 * Used to set the correct Content-Type on storage upload.
 *
 * ── SECURITY FIX: Issue #3 - WebP Secondary Signature Validation ─────
 * Validates both RIFF header and WEBP signature at offset 8 to prevent
 * false positives from other RIFF-based formats (.wav, .avi).
 */
export async function getVerifiedDocumentMimeType(file: File): Promise<string | null> {
  const header = await readFileHeader(file);

  for (const [mimeType, magicBytes] of Object.entries(MAGIC_BYTES)) {
    if (matchesMagicBytes(header, magicBytes)) {
      // WebP requires secondary validation at offset 8
      if (mimeType === "image/webp") {
        const secondaryBuffer = await file.slice(8, 12).arrayBuffer();
        const secondaryBytes = Array.from(new Uint8Array(secondaryBuffer));
        const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

        if (!matchesMagicBytes(secondaryBytes, webpSignature)) {
          continue; // RIFF but not WebP (e.g., .wav, .avi)
        }
      }

      return mimeType;
    }
  }

  return null;
}

export async function validateExpertDocumentFile(file: File) {
  if (!mimeTypeSet.has(file.type)) {
    return "Sadece PDF, JPG, PNG veya WebP formatinda belge yukleyebilirsin.";
  }

  const maxUploadBytes = getExpertDocumentMaxUploadBytes();
  if (file.size > maxUploadBytes) {
    return `Belge boyutu en fazla ${formatFileSize(maxUploadBytes)} olabilir.`;
  }

  const hasValidMagicBytes = await validateMagicBytes(file);
  if (!hasValidMagicBytes) {
    return "Gecerli bir dosya secmelisin.";
  }

  return null;
}

export function buildExpertDocumentStoragePath(
  userId: string,
  _fileName: string,
  verifiedMimeType?: string
): string {
  // Derive extension from verified MIME type — never trust user-supplied filename
  const MIME_TO_EXTENSION: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = verifiedMimeType ? (MIME_TO_EXTENSION[verifiedMimeType] ?? "pdf") : "pdf";
  return `documents/${userId}/${crypto.randomUUID()}.${extension}`;
}

export async function createExpertDocumentSignedUrl(
  storagePath: string,
  options?: {
    bucketName?: string;
    expiresIn?: number;
  }
) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const bucketName = options?.bucketName ?? process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS ?? "";

  if (!bucketName) {
    return null;
  }

  const { data, error } = await admin.storage
    .from(bucketName)
    .createSignedUrl(storagePath, options?.expiresIn ?? 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
