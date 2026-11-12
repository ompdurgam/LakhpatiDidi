import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { User } from "@/api/types"
import { useSession } from "@/stores/session"

import { persistQueries, restoreQueries } from "./queryPersist"

const signIn = () => useSession.getState().signIn("t", { id: 7 } as User, "state")

describe("query cache kept on the phone", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    signIn()
  })

  it("restores the last figures as stale, skips map boundaries, and forgets them on sign-out", () => {
    const first = new QueryClient()
    const stop = persistQueries(first)
    first.setQueryData(["monitoring", "overview"], { households: 12 })
    first.setQueryData(["geo", "area", "state", "CG"], { big: true })
    vi.advanceTimersByTime(2500)

    const next = new QueryClient()
    restoreQueries(next)
    expect(next.getQueryData(["monitoring", "overview"])).toEqual({ households: 12 })
    expect(next.getQueryData(["geo", "area", "state", "CG"])).toBeUndefined()

    useSession.getState().signOut()
    expect(Object.keys(localStorage).some((k) => k.startsWith("ld.query-cache:"))).toBe(false)
    expect(first.getQueryData(["monitoring", "overview"])).toBeUndefined()
    stop()
    vi.useRealTimers()
  })
})
