export const DRAWER_HEIGHTS = {
  sm: "max-h-[40vh]", // Quick actions, confirmations
  md: "max-h-[60vh]", // Forms, filters
  lg: "max-h-[85vh]", // Full content, menus
  full: "h-screen", // Immersive experiences
} as const;

export type DrawerHeight = keyof typeof DRAWER_HEIGHTS;
