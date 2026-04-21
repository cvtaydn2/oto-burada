export type RestrictionState = "active" | "restricted_review" | "banned";
export type TrustTone = "emerald" | "amber" | "slate" | "blue" | "rose";

export const trustThemes = {
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    notice: "bg-emerald-50 border-emerald-100 text-emerald-900"
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    notice: "bg-amber-50 border-amber-100 text-amber-900"
  },
  slate: {
    bg: "bg-slate-500/10",
    text: "text-slate-700",
    border: "border-slate-500/20",
    dot: "bg-slate-500",
    notice: "bg-slate-50 border-slate-100 text-slate-900"
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    notice: "bg-blue-50 border-blue-100 text-blue-900"
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/20",
    dot: "bg-rose-500",
    notice: "bg-rose-50 border-rose-100 text-rose-900"
  }
} as const;

export function getTrustStyles(tone: TrustTone) {
  return trustThemes[tone];
}

export function isBanned(restrictionState: RestrictionState | undefined): boolean {
  return restrictionState === "banned";
}

export function isRestrictedReview(restrictionState: RestrictionState | undefined): boolean {
  return restrictionState === "restricted_review";
}

export function isActive(restrictionState: RestrictionState | undefined): boolean {
  return restrictionState === "active" || restrictionState === undefined;
}

export function canShowPremium(restrictionState: RestrictionState | undefined): boolean {
  return isActive(restrictionState);
}

export function canContact(restrictionState: RestrictionState | undefined): boolean {
  return isActive(restrictionState);
}

export function getTrustDotColor(tone: TrustTone): string {
  const dotColors: Record<TrustTone, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    slate: "bg-slate-500",
    blue: "bg-blue-500",
    rose: "bg-rose-500",
  };
  return dotColors[tone];
}

export function getTrustIconBg(tone: TrustTone): string {
  const iconBgs: Record<TrustTone, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return iconBgs[tone];
}

export function getTrustToneClass(
  tone: "emerald" | "amber" | "slate" | "blue" | "rose",
  variant: "badge" | "notice" | "text" = "badge"
): string {
  const tones = {
    emerald: {
      badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
      notice: "bg-emerald-50 border-emerald-100 text-emerald-900",
      text: "text-emerald-600",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      notice: "bg-amber-50 border-amber-100 text-amber-900",
      text: "text-amber-700",
    },
    slate: {
      badge: "bg-slate-50 text-slate-600 border-slate-100",
      notice: "bg-slate-50 border-slate-100 text-slate-900",
      text: "text-slate-600",
    },
    blue: {
      badge: "bg-blue-50 text-blue-600 border-blue-100",
      notice: "bg-blue-50 border-blue-100 text-blue-900",
      text: "text-blue-600",
    },
    rose: {
      badge: "bg-rose-50 text-rose-600 border-rose-100",
      notice: "bg-rose-50 border-rose-100 text-rose-900",
      text: "text-rose-600",
    },
  };
  
  return tones[tone][variant];
}
