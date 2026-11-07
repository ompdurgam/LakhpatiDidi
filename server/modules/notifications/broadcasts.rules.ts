// Who may send a custom notice to whom. Pure rules (no database), unit-tested directly.
//
// A notice only travels DOWN the hierarchy and only inside the sender's own area:
//   admin / state  → the whole state, optionally one district
//   district       → its own district, optionally one block
//   block          → its own block
//   field (CRP)    → her own village
import type { Role } from "../../shared/types.ts"

/** Roles each sender may address. Department officers and Didis cannot broadcast. */
export const SENDABLE_ROLES: Record<Role, Role[]> = {
  admin: ["state", "district", "department", "block", "field", "didi"],
  state: ["district", "department", "block", "field", "didi"],
  district: ["department", "block", "field", "didi"],
  block: ["field", "didi"],
  field: ["didi"],
  department: [],
  didi: [],
}

export const canBroadcast = (role: Role) => SENDABLE_ROLES[role].length > 0

/** The area a sender may narrow their audience to (a district for state staff, a block for a DPM). */
export type AreaLevel = "district" | "block" | null

export const areaLevelFor = (role: Role): AreaLevel =>
  role === "admin" || role === "state" ? "district" : role === "district" ? "block" : null

/** The sender's own place in the hierarchy (from master_users). */
export type Sender = {
  id: number
  role: Role
  districtId: number | null
  blockId: number | null
  villageId: number | null
}

/** Where recipients must be. Each set field is an AND filter on the recipient's location. */
export type Scope = { districtId?: number; blockId?: number; villageId?: number }

export class ScopeError extends Error {
  readonly reason: "not_allowed" | "no_area" | "bad_roles"
  constructor(reason: ScopeError["reason"]) {
    super(reason)
    this.reason = reason
  }
}

/**
 * The location filter for a sender's audience. `areaId` is the optional narrower area
 * (validated to lie inside the sender's area by the caller for blocks).
 */
export function scopeFor(sender: Sender, areaId?: number | null): Scope {
  switch (sender.role) {
    case "admin":
    case "state":
      return areaId ? { districtId: areaId } : {}
    case "district":
      if (!sender.districtId) throw new ScopeError("no_area")
      return areaId
        ? { districtId: sender.districtId, blockId: areaId }
        : { districtId: sender.districtId }
    case "block":
      if (!sender.blockId) throw new ScopeError("no_area")
      return { blockId: sender.blockId }
    case "field":
      if (!sender.villageId) throw new ScopeError("no_area")
      return { villageId: sender.villageId }
    default:
      throw new ScopeError("not_allowed")
  }
}

/** Keeps only the roles this sender may address; throws when none are left. */
export function allowedRoles(sender: Role, requested: readonly string[]): Role[] {
  const allowed = SENDABLE_ROLES[sender]
  if (!allowed.length) throw new ScopeError("not_allowed")
  const roles = allowed.filter((role) => requested.includes(role))
  if (!roles.length || roles.length !== new Set(requested).size) throw new ScopeError("bad_roles")
  return roles
}

/** Most notices a person may send in an hour (keeps an accidental double-tap or a loop harmless). */
export const HOURLY_LIMIT = 10
