/**
 * Centralized upload policies to prevent configuration drift
 * across different file-type handlers.
 */

export const UPLOAD_POLICY = {
  IMAGES: {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
    MAX_DAILY_UPLOADS: 50,
    STRIP_METADATA: true,
  },
  DOCUMENTS: {
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: ["application/pdf", "image/jpeg", "image/png"],
    MAX_DAILY_UPLOADS: 10,
  },
} as const;

export type UploadPolicyType = keyof typeof UPLOAD_POLICY;

export function isFileTooLarge(size: number, type: UploadPolicyType): boolean {
  return size > UPLOAD_POLICY[type].MAX_FILE_SIZE_BYTES;
}

export function isMimeTypeAllowed(mime: string, type: UploadPolicyType): boolean {
  // @ts-expect-error - indexing with dynamic key
  return UPLOAD_POLICY[type].ALLOWED_MIME_TYPES.includes(mime);
}
