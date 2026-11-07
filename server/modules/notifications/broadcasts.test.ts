import { describe, expect, it } from "vitest"

import {
  allowedRoles,
  areaLevelFor,
  canBroadcast,
  ScopeError,
  scopeFor,
  type Sender,
} from "./broadcasts.rules.ts"

const sender = (role: Sender["role"], place: Partial<Sender> = {}): Sender => ({
  id: 1,
  role,
  districtId: null,
  blockId: null,
  villageId: null,
  ...place,
})

const reason = (fn: () => unknown) => {
  try {
    fn()
  } catch (error) {
    return error instanceof ScopeError ? error.reason : "other"
  }
  return "none"
}

describe("broadcast rules", () => {
  it("lets each level address only the levels below it", () => {
    expect(allowedRoles("admin", ["didi", "state"])).toEqual(["state", "didi"])
    expect(allowedRoles("block", ["field", "didi"])).toEqual(["field", "didi"])
    expect(allowedRoles("field", ["didi"])).toEqual(["didi"])
    expect(reason(() => allowedRoles("field", ["block"]))).toBe("bad_roles")
    expect(reason(() => allowedRoles("block", ["didi", "district"]))).toBe("bad_roles")
    expect(reason(() => allowedRoles("district", []))).toBe("bad_roles")
  })

  it("never lets a department officer or a Didi broadcast", () => {
    expect(canBroadcast("department")).toBe(false)
    expect(canBroadcast("didi")).toBe(false)
    expect(reason(() => allowedRoles("didi", ["didi"]))).toBe("not_allowed")
    expect(reason(() => scopeFor(sender("department")))).toBe("not_allowed")
  })

  it("keeps the audience inside the sender's own area", () => {
    expect(scopeFor(sender("admin"))).toEqual({})
    expect(scopeFor(sender("state"), 7)).toEqual({ districtId: 7 })
    expect(scopeFor(sender("district", { districtId: 3 }))).toEqual({ districtId: 3 })
    // A DPM narrowing to a block still stays inside her district.
    expect(scopeFor(sender("district", { districtId: 3 }), 9)).toEqual({ districtId: 3, blockId: 9 })
    // Block and CRP senders cannot widen their area, whatever area id is sent.
    expect(scopeFor(sender("block", { blockId: 5 }), 99)).toEqual({ blockId: 5 })
    expect(scopeFor(sender("field", { villageId: 11 }), 99)).toEqual({ villageId: 11 })
  })

  it("refuses a sender whose own area is not set", () => {
    expect(reason(() => scopeFor(sender("district")))).toBe("no_area")
    expect(reason(() => scopeFor(sender("block")))).toBe("no_area")
    expect(reason(() => scopeFor(sender("field")))).toBe("no_area")
  })

  it("offers an area picker only to state staff and the DPM", () => {
    expect(areaLevelFor("admin")).toBe("district")
    expect(areaLevelFor("district")).toBe("block")
    expect(areaLevelFor("block")).toBeNull()
    expect(areaLevelFor("field")).toBeNull()
  })
})
