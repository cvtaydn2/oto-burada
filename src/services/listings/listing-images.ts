import {
  listingImageAcceptedMimeTypes,
  listingImageMaxSizeInBytes,
} from "@/lib/constants/domain";

const mimeTypeSet = new Set<string>(listingImageAcceptedMimeTypes);

// Magic bytes → verified MIME type map
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

// Safe file extensions derived from verified MIME types
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function formatFileSize(sizeInBytes: number) {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function getListingImageConstraintsText() {
  const acceptedTypes = listingImageAcceptedMimeTypes
    .map((mimeType) => mimeType.replace("image/", "").toUpperCase())
    .join(", ");

  return `${acceptedTypes} formatlari, en fazla ${formatFileSize(listingImageMaxSizeInBytes)}`;
}

async function readFileHeader(file: File): Promise<number[]> {
  const buffer = await file.slice(0, 4).arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}

function matchesMagicBytes(header: number[], magicBytes: number[]): boolean {
  return magicBytes.every((byte, index) => header[index] === byte);
}

/**
 * Reads the file header and returns the verified MIME type from magic bytes.
 * Returns null if the file header does not match any known image type.
 */
export async function getVerifiedMimeType(file: File): Promise<string | null> {
  const header = await readFileHeader(file);

  for (const [mimeType, magicBytes] of Object.entries(MAGIC_BYTES)) {
    if (matchesMagicBytes(header, magicBytes)) {
      return mimeType;
    }
  }

  return null;
}

export async function validateListingImageFile(file: File): Promise<string | null> {
  // 1. Check declared MIME type is in allowlist (fast pre-check)
  if (!mimeTypeSet.has(file.type)) {
    return "Sadece JPG, PNG veya WebP formatinda gorsel yukleyebilirsin.";
  }

  // 2. Check file size
  if (file.size > listingImageMaxSizeInBytes) {
    return `Her bir fotograf en fazla ${formatFileSize(listingImageMaxSizeInBytes)} olabilir.`;
  }

  // 3. Verify actual content via magic bytes
  const verifiedMime = await getVerifiedMimeType(file);
  if (!verifiedMime) {
    return "Gecerli bir görsel dosyasi secmelisin.";
  }

  return null;
}

/**
 * Builds a storage path for a listing image.
 * Uses the VERIFIED MIME type (from magic bytes) to determine the extension —
 * never trusts the user-supplied file name or declared MIME type.
 */
export function buildListingImageStoragePath(
  userId: string,
  _fileName: string,
  verifiedMimeType?: string,
): string {
  // Prefer verified MIME type extension; fall back to jpg if unknown
  const extension = verifiedMimeType
    ? (MIME_TO_EXTENSION[verifiedMimeType] ?? "jpg")
    : "jpg";
  return `listings/${userId}/${crypto.randomUUID()}.${extension}`;
}
