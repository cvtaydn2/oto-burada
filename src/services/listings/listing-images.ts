import {
  listingImageAcceptedMimeTypes,
  listingImageMaxSizeInBytes,
} from "@/lib/constants/domain";

const mimeTypeSet = new Set<string>(listingImageAcceptedMimeTypes);

export function formatFileSize(sizeInBytes: number) {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function getListingImageConstraintsText() {
  const acceptedTypes = listingImageAcceptedMimeTypes
    .map((mimeType) => mimeType.replace("image/", "").toUpperCase())
    .join(", ");

  return `${acceptedTypes} formatlari, en fazla ${formatFileSize(listingImageMaxSizeInBytes)}`;
}

export function validateListingImageFile(file: File) {
  if (!mimeTypeSet.has(file.type)) {
    return "Sadece JPG, PNG veya WebP formatinda gorsel yukleyebilirsin.";
  }

  if (file.size > listingImageMaxSizeInBytes) {
    return `Her bir fotograf en fazla ${formatFileSize(listingImageMaxSizeInBytes)} olabilir.`;
  }

  return null;
}

export function buildListingImageStoragePath(userId: string, fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "jpg" : "jpg";
  return `listings/${userId}/${crypto.randomUUID()}.${extension}`;
}
