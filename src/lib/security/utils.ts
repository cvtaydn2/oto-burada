// Security utilities
export function isValidRequestOrigin(origin: string): boolean {
  // Basic origin validation - can be extended
  return typeof origin === "string" && origin.length > 0;
}
