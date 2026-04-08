export const REQUEST_SIZE_LIMITS = {
  listing: 1024 * 1024,
  report: 100 * 1024,
  image: 6 * 1024 * 1024,
} as const;

export function isRequestTooLarge(contentLength: string | null, limit: number): boolean {
  if (!contentLength) return false;
  const size = parseInt(contentLength, 10);
  return size > limit;
}

export function createRequestSizeErrorMessage(entity: keyof typeof REQUEST_SIZE_LIMITS): string {
  const limit = REQUEST_SIZE_LIMITS[entity];
  const mb = (limit / (1024 * 1024)).toFixed(1);
  return `Request body too large. Maximum ${mb} MB allowed.`;
}