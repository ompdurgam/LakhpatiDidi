import { afterEach, describe, expect, it, vi } from "vitest"

import { isRole, useSession } from "./session"
import { useUi } from "./ui"

describe("session store", () => {
  it("signs in and out", () => {
    const user = { id: 1, name: "x", role: "block", designation: "d", initials: "X" }
    useSession.getState().signIn("tok", user, "department")
    expect(useSession.getState()).toMatchObject({ token: "tok", role: "department" })
    useSession.getState().signOut()
    expect(useSession.getState().token).toBeNull()
  })

  it("validates role names", () => {
    expect(isRole("admin")).toBe(true)
    expect(isRole("superuser")).toBe(false)
    expect(isRole(undefined)).toBe(false)
  })
})

describe("ui store", () => {
  afterEach(() => vi.useRealTimers())

  it("shows a toast and clears it after 2.6s", () => {
    vi.useFakeTimers()
    useUi.getState().notify("सहेजा गया")
    expect(useUi.getState().toast).toBe("सहेजा गया")
    vi.advanceTimersByTime(2600)
    expect(useUi.getState().toast).toBe("")
  })

  it("keeps the latest toast when notified twice", () => {
    vi.useFakeTimers()
    useUi.getState().notify("एक")
    vi.advanceTimersByTime(2000)
    useUi.getState().notify("दो")
    vi.advanceTimersByTime(1000)
    expect(useUi.getState().toast).toBe("दो")
  })
})
