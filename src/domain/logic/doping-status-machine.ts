/**
 * Doping Status Machine
 *
 * Manages state transitions for doping purchases.
 * Mirrors the activate_doping RPC logic on the client side for UI feedback.
 */

export type DopingStatus = "pending" | "active" | "expired" | "cancelled";

export type DopingType = "featured" | "urgent" | "highlighted" | "gallery" | "bump";

export interface DopingState {
  status: DopingStatus;
  type: DopingType;
  startsAt: string;
  expiresAt: string | null;
}

export interface DopingTransitionResult {
  allowed: boolean;
  nextStatus?: DopingStatus;
  reason?: string;
}

/**
 * Determines if a doping purchase can transition to a new status.
 */
export function canTransitionDoping(
  current: DopingStatus,
  next: DopingStatus
): DopingTransitionResult {
  const transitions: Record<DopingStatus, DopingStatus[]> = {
    pending: ["active", "cancelled"],
    active: ["expired", "cancelled"],
    expired: [],
    cancelled: [],
  };

  const allowed = transitions[current]?.includes(next) ?? false;

  if (!allowed) {
    return {
      allowed: false,
      reason: `Doping '${current}' durumundan '${next}' durumuna geçemez.`,
    };
  }

  return { allowed: true, nextStatus: next };
}

/**
 * Checks if a doping is currently active based on its state.
 */
export function isDopingActive(state: DopingState): boolean {
  if (state.status !== "active") return false;
  if (!state.expiresAt) return true; // bump type has no expiry
  return new Date(state.expiresAt) > new Date();
}

/**
 * Returns the remaining time for a doping in human-readable format.
 */
export function getDopingRemainingTime(expiresAt: string | null): string {
  if (!expiresAt) return "Süresiz";

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return "Süresi doldu";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} gün kaldı`;
  if (diffHours > 0) return `${diffHours} saat kaldı`;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `${diffMinutes} dakika kaldı`;
}

/**
 * Returns the listing column updates for a given doping type.
 * Used for optimistic UI updates before server confirmation.
 */
export function getDopingListingUpdates(
  type: DopingType,
  expiresAt: string | null
): Record<string, unknown> {
  switch (type) {
    case "featured":
      return { featured: true, isFeatured: true, featuredUntil: expiresAt };
    case "urgent":
      return { isUrgent: true, urgentUntil: expiresAt };
    case "highlighted":
      return { highlightedUntil: expiresAt, frameColor: "orange" };
    case "gallery":
      return { galleryPriority: 10 };
    case "bump":
      return { bumpedAt: new Date().toISOString() };
    default:
      return {};
  }
}

/**
 * Returns a human-readable label for a doping type.
 */
export function getDopingTypeLabel(type: DopingType): string {
  const labels: Record<DopingType, string> = {
    featured: "Ön Planda",
    urgent: "Acil İlan",
    highlighted: "Renkli Çerçeve",
    gallery: "Galeri Highlight",
    bump: "Yenile",
  };
  return labels[type] ?? type;
}
