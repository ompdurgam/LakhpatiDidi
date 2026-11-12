import type { Role } from "@/stores/session"

// Each feature's pages module is its own chunk, loaded on first visit.
export const block = () => import("@/features/block/pages")
export const field = () => import("@/features/survey/pages")
export const dept = () => import("@/features/department/pages")
export const monitoring = () => import("@/features/monitoring/pages")
export const admin = () => import("@/features/admin/pages")
export const geo = () => import("@/features/geo/pages")
export const didi = () => import("@/features/didi/pages")

const BY_ROLE: Record<Role, (() => Promise<unknown>)[]> = {
  field: [field],
  block: [block, geo],
  department: [dept],
  district: [monitoring, geo],
  state: [monitoring, geo],
  admin: [admin],
  didi: [didi],
}

/** Fetches the role's screens while the browser is idle, so the next tap opens at once. */
export function preloadRole(role: Role) {
  const run = () => BY_ROLE[role].forEach((load) => void load().catch(() => undefined))
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 3000 })
  } else setTimeout(run, 1500)
}
