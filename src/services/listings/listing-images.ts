import {
  listingImageAcceptedMimeTypes,
  listingImageMaxSizeInBytes,
} from "@/lib/constants/domain";

const mimeTypeSet = new Set<string>(listingImageAcceptedMimeTypes);

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
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

async function validateMagicBytes(file: File): Promise<boolean> {
  const header = await readFileHeader(file);

  for (const magicBytes of Object.values(MAGIC_BYTES)) {
    if (matchesMagicBytes(header, magicBytes)) {
      return true;
    }
  }

  return false;
}

export async function validateListingImageFile(file: File) {
  if (!mimeTypeSet.has(file.type)) {
    return "Sadece JPG, PNG veya WebP formatinda gorsel yukleyebilirsin.";
  }

  if (file.size > listingImageMaxSizeInBytes) {
    return `Her bir fotograf en fazla ${formatFileSize(listingImageMaxSizeInBytes)} olabilir.`;
  }

  const hasValidMagicBytes = await validateMagicBytes(file);
  if (!hasValidMagicBytes) {
    return "Gecerli bir görsel dosyasi secmelisin.";
  }

  return null;
}

export function buildListingImageStoragePath(userId: string, fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "jpg" : "jpg";
  return `listings/${userId}/${crypto.randomUUID()}.${extension}`;
}
