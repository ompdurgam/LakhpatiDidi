import { describe, expect, it } from "vitest"

import { financing, paybackMonths, shares, totalOf } from "./finance"

describe("DPR finance (matches the server)", () => {
  it("splits 60% subsidy into 30% loan and 10% own share", () => {
    expect(financing(120_000, 60, 150_000)).toEqual({
      total: 120_000,
      subsidy: 72_000,
      bank: 36_000,
      own: 12_000,
    })
  })

  it("caps the subsidy at the scheme maximum and keeps the parts equal to the total", () => {
    const m = financing(200_000, 60, 100_000)
    expect(m.subsidy).toBe(60_000)
    expect(m.subsidy + m.bank + m.own).toBe(200_000)
  })

  it("ignores blank amounts in the total", () => {
    expect(totalOf([{ amount: 1000 }, { amount: Number.NaN }, { amount: 500 }])).toBe(1500)
  })

  it("pays back in months of the extra income, or never without gain", () => {
    expect(paybackMonths({ total: 0, subsidy: 0, bank: 36_000, own: 12_000 }, 37_500)).toBe(16)
    expect(paybackMonths({ total: 0, subsidy: 0, bank: 1, own: 0 }, 0)).toBeNull()
  })

  it("donut shares always add up to 100", () => {
    const s = shares(financing(99_999, 55, 0))
    expect(s.subsidy + s.bank + s.own).toBe(100)
    expect(shares(financing(0, 60, 0))).toEqual({ subsidy: 0, bank: 0, own: 0 })
  })
})
