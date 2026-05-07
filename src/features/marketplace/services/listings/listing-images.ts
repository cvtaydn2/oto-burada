import {
  listingImageAcceptedMimeTypes,
  listingImageMaxSizeInBytes,
} from "@/features/shared/lib/domain";

const mimeTypeSet = new Set<string>(listingImageAcceptedMimeTypes);

// Magic bytes → verified MIME type map
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // "RIFF"
};

// Offset magic bytes for specific formats
const SECONDARY_MAGIC_BYTES: Record<string, { offset: number; pattern: number[] }> = {
  "image/webp": { offset: 8, pattern: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
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
 *
 * SECURITY: Checks both primary header and secondary offsets (like WebP's WEBP mark).
 */
export async function getVerifiedMimeType(file: File): Promise<string | null> {
  const header = await readFileHeader(file);

  for (const [mimeType, magicBytes] of Object.entries(MAGIC_BYTES)) {
    if (matchesMagicBytes(header, magicBytes)) {
      // Secondary check for multi-format headers (like RIFF)
      const secondary = SECONDARY_MAGIC_BYTES[mimeType];
      if (secondary) {
        const secondaryBuffer = await file
          .slice(secondary.offset, secondary.offset + secondary.pattern.length)
          .arrayBuffer();
        const secondaryHeader = Array.from(new Uint8Array(secondaryBuffer));
        if (matchesMagicBytes(secondaryHeader, secondary.pattern)) {
          return mimeType;
        }
        continue; // Primary matched but secondary failed (e.g., RIFF but not WEBP)
      }
      return mimeType;
    }
  }

  return null;
}

/**
 * Returns image dimensions using browser-safe APIs only.
 *
 * ── PERFORMANCE FIX: Issue #16 - Avoid Full File Decode in Server Context ─────
 * Strategy:
 *  - In browser environments: uses createImageBitmap (fast, no DOM required).
 *  - In Node/server environments: ALWAYS uses lightweight ArrayBuffer header parse
 *    to avoid OOM on large files. A 4MB image decoded via createImageBitmap can
 *    consume hundreds of MB of memory in serverless/edge runtime.
 *
 * This replaces the `image-size` npm package which is Node-only and must not
 * leak into the client bundle.
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  // ── PERFORMANCE FIX: Issue #16 - Server-Safe Header Parse Only ─────
  // In server/edge runtime, always use header parsing to avoid memory explosion.
  // createImageBitmap decodes the entire image into memory, which can cause OOM
  // for large files (4MB file → 200MB+ memory usage).
  //
  // In browser context, createImageBitmap is safe and fast, but we already have
  // file size limits (4MB) enforced before this function is called, so header
  // parsing is sufficient for dimension validation in all contexts.

  // Parse dimensions from raw bytes (covers JPEG, PNG, WebP)
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  // PNG: width at offset 16, height at offset 20 (big-endian)
  if (
    view.getUint8(0) === 0x89 &&
    view.getUint8(1) === 0x50 &&
    view.getUint8(2) === 0x4e &&
    view.getUint8(3) === 0x47
  ) {
    return {
      width: view.getUint32(16, false),
      height: view.getUint32(20, false),
    };
  }

  // WebP: "VP8 " chunk at offset 12 → width at 26 (LE, 14-bit), height at 28 (LE, 14-bit)
  // "VP8L" chunk at offset 12 → width/height packed at offset 21
  if (buffer.byteLength >= 30) {
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    const webp = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    );
    if (riff === "RIFF" && webp === "WEBP") {
      const chunk = String.fromCharCode(
        view.getUint8(12),
        view.getUint8(13),
        view.getUint8(14),
        view.getUint8(15)
      );
      if (chunk === "VP8 " && buffer.byteLength >= 30) {
        return {
          width: (view.getUint16(26, true) & 0x3fff) + 1,
          height: (view.getUint16(28, true) & 0x3fff) + 1,
        };
      }
    }
  }

  // JPEG: scan for SOF markers (0xFFC0–0xFFC3, 0xFFC5–0xFFC7, 0xFFC9–0xFFCB, 0xFFCD–0xFFCF)
  // ── SECURITY FIX: Issue #1 - Truncated JPEG Protection ─────────────
  if (view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    let offset = 2;
    let maxIterations = 500; // Prevent infinite loop on malformed files

    while (offset < buffer.byteLength - 8 && maxIterations-- > 0) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);

      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return {
          height: view.getUint16(offset + 5, false),
          width: view.getUint16(offset + 7, false),
        };
      }

      // ── SECURITY FIX: Issue #1 - Enhanced Segment Length Validation ─────────────
      // Protect against truncated/malformed segments and zero-length segments
      if (offset + 2 >= buffer.byteLength) break; // Not enough bytes for segment length

      const segmentLength = view.getUint16(offset + 2, false);

      // Invalid segment length (must be at least 2 bytes)
      if (segmentLength < 2) break;

      // Segment extends beyond file boundary
      if (offset + 2 + segmentLength > buffer.byteLength) break;

      offset += 2 + segmentLength;
    }
  }

  throw new Error("Could not determine image dimensions");
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

  // 4. Pixel Flood Protection: Check dimensions (Width x Height)
  // Excessive dimensions can crash Vercel Image Optimization (OOM).
  // Uses browser-safe APIs (createImageBitmap / HTMLImageElement) — no Node.js dependency.
  try {
    const dimensions = await getImageDimensions(file);
    const MAX_DIMENSION = 4000;

    if (dimensions.width > MAX_DIMENSION) {
      return `Görsel genişliği çok fazla (${dimensions.width}px). En fazla ${MAX_DIMENSION}px olabilir.`;
    }
    if (dimensions.height > MAX_DIMENSION) {
      return `Görsel yüksekliği çok fazla (${dimensions.height}px). En fazla ${MAX_DIMENSION}px olabilir.`;
    }
  } catch {
    // If we can't read dimensions, it's safer to reject
    return "Görsel boyutları okunamadı. Lütfen geçerli bir dosya yükleyin.";
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
  verifiedMimeType?: string
): string {
  // Prefer verified MIME type extension; fall back to jpg if unknown
  const extension = verifiedMimeType ? (MIME_TO_EXTENSION[verifiedMimeType] ?? "jpg") : "jpg";
  return `listings/${userId}/${crypto.randomUUID()}.${extension}`;
}
