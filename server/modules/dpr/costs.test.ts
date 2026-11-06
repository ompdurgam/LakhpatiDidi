import { describe, expect, it } from "vitest"

import { defaultCostItems, defaultProjectCost, financing, paybackMonths, totalOf } from "./costs.ts"

describe("default project cost", () => {
  it("is 80% of the cap in whole thousands, with a fallback", () => {
    expect(defaultProjectCost(150_000)).toBe(120_000)
    expect(defaultProjectCost(60_000)).toBe(48_000)
    expect(defaultProjectCost(0)).toBe(100_000)
  })
})

describe("default cost items", () => {
  it("always add up exactly to the total", () => {
    for (const code of [
      "AH_POULTRY",
      "AH_GOAT",
      "PMMSY_POND",
      "FISH_BOATNET",
      "NHM_MICRO",
      "PMEGP",
      "NOPE",
    ]) {
      for (const total of [48_000, 120_000, 99_900]) {
        const items = defaultCostItems(code, total)
        expect(totalOf(items), `${code} ${total}`).toBe(total)
        expect(items.every((i) => i.amount >= 0 && i.item && i.quantity)).toBe(true)
      }
    }
  })

  it("falls back to a single item for an unknown scheme", () => {
    expect(defaultCostItems("NOPE", 50_000)).toHaveLength(1)
  })
})

describe("financing", () => {
  it("splits 60% subsidy into 30% bank loan and 10% own share", () => {
    expect(financing(120_000, 60, 150_000)).toEqual({
      total: 120_000,
      subsidy: 72_000,
      bank: 36_000,
      own: 12_000,
    })
  })

  it("caps the subsidy base at the scheme's maximum cost", () => {
    const f = financing(200_000, 60, 100_000)
    expect(f.subsidy).toBe(60_000) // 60% of the ₹1 lakh cap, not of ₹2 lakh
    expect(f.subsidy + f.bank + f.own).toBe(200_000)
  })

  it("needs no loan when the subsidy covers everything", () => {
    expect(financing(30_000, 100, 50_000)).toEqual({
      total: 30_000,
      subsidy: 30_000,
      bank: 0,
      own: 0,
    })
  })

  it("never lets the parts exceed or fall short of the total", () => {
    for (const [total, pct] of [
      [99_999, 55],
      [48_000, 33.33],
      [1, 60],
    ] as const) {
      const f = financing(total, pct, 0)
      expect(f.subsidy + f.bank + f.own).toBe(total)
      expect(f.subsidy).toBeLessThanOrEqual(total)
    }
  })
})

describe("payback", () => {
  it("is the money she puts in divided by the monthly extra income", () => {
    expect(paybackMonths({ bank: 36_000, own: 12_000 }, 37_500)).toBe(16)
    expect(paybackMonths({ bank: 0, own: 0 }, 10_000)).toBe(0)
    expect(paybackMonths({ bank: 10_000, own: 0 }, 0)).toBeNull()
  })
})
