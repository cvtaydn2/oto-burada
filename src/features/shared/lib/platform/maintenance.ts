/**
 * Maintenance gate policy:
 * - Production: honor database maintenance flag by default.
 * - Development/Test: bypass by default so local and CI workflows are not blocked.
 *
 * Env overrides:
 * - MAINTENANCE_MODE_FORCE=true   -> always enable maintenance gate
 * - MAINTENANCE_MODE_BYPASS=true  -> always bypass maintenance gate
 */
export function isMaintenanceGateActive(): boolean {
  // Always allow in development unless forced
  if (process.env.NODE_ENV === "development" && process.env.MAINTENANCE_MODE_FORCE !== "true") {
    return false;
  }

  if (process.env.MAINTENANCE_MODE_FORCE === "true") {
    return true;
  }

  if (process.env.MAINTENANCE_MODE_BYPASS === "true") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

export function shouldShowMaintenanceScreen(maintenanceModeEnabled: boolean | undefined): boolean {
  return Boolean(maintenanceModeEnabled) && isMaintenanceGateActive();
}
