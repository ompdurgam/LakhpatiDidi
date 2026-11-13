import { describe, expect, it } from "vitest"

import { rankOf } from "./compare"

describe("rankOf", () => {
  const rows = [
    { id: 1, code: "A", value: 10 },
    { id: 2, code: "B", value: 30 },
    { id: 3, code: "C", value: 30 },
    { id: 4, code: "D", value: 5 },
  ]

  it("ranks higher values first and shares ties", () => {
    expect(rankOf(rows, "B")).toBe(1)
    expect(rankOf(rows, "C")).toBe(1)
    expect(rankOf(rows, "A")).toBe(3)
    expect(rankOf(rows, "D")).toBe(4)
  })

  it("ranks lower values first when lower is better", () => {
    expect(rankOf(rows, "D", true)).toBe(1)
    expect(rankOf(rows, "B", true)).toBe(3)
  })

  it("returns null for an unknown area", () => {
    expect(rankOf(rows, "Z")).toBeNull()
  })
})
