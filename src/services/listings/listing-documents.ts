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

export async function validateExpertDocumentFile(file: File) {
  if (!mimeTypeSet.has(file.type)) {
    return "Sadece PDF, JPG, PNG veya WebP formatinda belge yukleyebilirsin.";
  }

  if (file.size > expertDocumentMaxSizeInBytes) {
    return `Belge boyutu en fazla ${formatFileSize(expertDocumentMaxSizeInBytes)} olabilir.`;
  }

  const hasValidMagicBytes = await validateMagicBytes(file);
  if (!hasValidMagicBytes) {
    return "Gecerli bir dosya secmelisin.";
  }

  return null;
}

export function buildExpertDocumentStoragePath(userId: string, fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "pdf" : "pdf";
  return `documents/${userId}/${crypto.randomUUID()}.${extension}`;
}

export async function createExpertDocumentSignedUrl(
  storagePath: string,
  options?: {
    bucketName?: string;
    expiresIn?: number;
  },
) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const bucketName = options?.bucketName ?? process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS ?? "";

  if (!bucketName) {
    return null;
  }

  const { data, error } = await admin.storage
    .from(bucketName)
    .createSignedUrl(storagePath, options?.expiresIn ?? 600);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
