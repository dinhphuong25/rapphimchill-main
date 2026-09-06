export interface MaintenanceState {
  enabled: boolean;
  reason?: string;
  startedAt?: string;
  estimatedEndTime?: string;
  updatedAt?: string;
}

export const DEFAULT_MAINTENANCE_TOKEN = process.env.SYSTEM_MAINTENANCE_TOKEN || "hiphim_secret_2026";
export const BYPASS_COOKIE_NAME = "hiphim_maintenance_bypass";
export const MAINTENANCE_COOKIE_NAME = "hiphim_maintenance_active";

declare global {
  // eslint-disable-next-line no-var
  var __HIPHIM_MAINTENANCE__: MaintenanceState | undefined;
}

// In-memory global state for Node.js / Runtime worker
if (!globalThis.__HIPHIM_MAINTENANCE__) {
  globalThis.__HIPHIM_MAINTENANCE__ = {
    enabled: process.env.MAINTENANCE_MODE === "true" || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
    reason: "Hệ thống đang được nâng cấp định kỳ để cải thiện trải nghiệm xem phim.",
    estimatedEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  };
}

export function getMaintenanceState(): MaintenanceState {
  const isEnvEnabled = process.env.MAINTENANCE_MODE === "true" || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const state = globalThis.__HIPHIM_MAINTENANCE__ || {
    enabled: isEnvEnabled,
    reason: "Hệ thống đang được nâng cấp định kỳ.",
  };
  if (isEnvEnabled) {
    state.enabled = true;
  }
  return state;
}

export function setMaintenanceState(newState: Partial<MaintenanceState>): MaintenanceState {
  const current = getMaintenanceState();
  const updated: MaintenanceState = {
    ...current,
    ...newState,
    updatedAt: new Date().toISOString(),
  };
  globalThis.__HIPHIM_MAINTENANCE__ = updated;
  return updated;
}

export function verifyMaintenanceToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token === DEFAULT_MAINTENANCE_TOKEN;
}
