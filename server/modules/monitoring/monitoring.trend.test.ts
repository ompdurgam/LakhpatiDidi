import { describe, expect, it } from "vitest"

import { monthKeys } from "./monitoring.trend.ts"

describe("monthKeys", () => {
  it("lists the last months oldest first, ending with the current one", () => {
    expect(monthKeys(3, new Date(2026, 10, 13))).toEqual(["2026-09", "2026-10", "2026-11"])
  })

  it("crosses the year boundary", () => {
    expect(monthKeys(4, new Date(2026, 1, 2))).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"])
  })
})
