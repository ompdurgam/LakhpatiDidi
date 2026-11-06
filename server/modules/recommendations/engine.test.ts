import { describe, expect, it } from "vitest"

import { leverage, recommend, sourceKind } from "./engine.ts"
import type { Profile, SourceKind } from "./types.ts"

const profile = (
  over: Omit<Partial<Profile>, "kinds"> & { kinds?: SourceKind[] } = {},
): Profile => ({
  income: 70_000,
  activeSources: 1,
  category: "ST",
  special: "NONE",
  block: "Jagdalpur",
  ...over,
  kinds: new Set(over.kinds ?? []),
})
const codes = (p: Profile, applied: string[] = []) =>
  recommend(p, new Set(applied)).map((r) => r.code)

describe("sourceKind", () => {
  it("maps survey names to kinds and falls back to other", () => {
    expect(sourceKind("वन उपज")).toBe("forest")
    expect(sourceKind("फसल/खेती")).toBe("farming")
    expect(sourceKind("कुछ और")).toBe("other")
  })
})

describe("recommend", () => {
  it("suggests fisheries upgrades to a Didi who already fishes, not an own-land pond", () => {
    const list = codes(profile({ kinds: ["fisheries", "farming"] }))
    expect(list).toContain("FISH_BOATNET")
    expect(list).toContain("PMMSY_POND")
    expect(list).not.toContain("FISH_OWNPOND")
  })

  it("suggests forest schemes to forest gatherers and FRA holders", () => {
    expect(codes(profile({ kinds: ["forest"], special: "FRA" }))).toEqual(
      expect.arrayContaining(["VANDHAN", "LAC"]),
    )
    // No forest income but a forest right: Van Dhan only.
    const list = codes(profile({ kinds: ["wage"], special: "PVTG" }))
    expect(list).toContain("VANDHAN")
    expect(list).not.toContain("LAC")
  })

  it("only offers enterprise credit to Didis with an enterprise (or several sources)", () => {
    expect(codes(profile({ kinds: ["nonfarm"] }))).toEqual(
      expect.arrayContaining(["PMEGP", "MUDRA"]),
    )
    expect(codes(profile({ kinds: ["farming"], activeSources: 1 }))).not.toContain("MUDRA")
    expect(codes(profile({ kinds: ["farming", "wage"], activeSources: 2 }))).toContain("MUDRA")
  })

  it("is personal: different Didis get different lists", () => {
    const farmer = codes(profile({ kinds: ["farming"] }))
    const guide = codes(profile({ kinds: ["tourism"] }))
    expect(farmer).toContain("NHM_MICRO")
    expect(guide).toContain("CG_HOMESTAY")
    expect(farmer).not.toEqual(guide)
  })

  it("leaves out schemes she already applied for", () => {
    expect(codes(profile({ kinds: ["nonfarm"] }), ["PMEGP"])).not.toContain("PMEGP")
  })

  it("ranks best fit first and keeps scores in range", () => {
    const list = recommend(profile({ kinds: ["tourism", "farming"], special: "FRA" }))
    const scores = list.map((r) => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(scores.every((s) => s >= 45 && s <= 98)).toBe(true)
    expect(list.length).toBeLessThanOrEqual(8)
  })

  it("every recommendation says why and has at least one check", () => {
    for (const r of recommend(profile({ kinds: ["farming", "forest"], special: "FRA" }))) {
      expect(r.why.length).toBeGreaterThan(0)
      expect(r.checks.length).toBeGreaterThan(0)
      expect(r.office).not.toContain("{{")
    }
  })

  it("gives a bonus to a scheme that alone reaches Lakhpati", () => {
    const base = recommend(profile({ kinds: ["tourism"], income: 30_000 })).find(
      (r) => r.code === "CG_HOMESTAY",
    )!
    const near = recommend(profile({ kinds: ["tourism"], income: 45_000 })).find(
      (r) => r.code === "CG_HOMESTAY",
    )!
    expect(near.score).toBeGreaterThan(base.score) // 45k + 60k ≥ 1 lakh
  })
})

describe("leverage", () => {
  it("adds the top three gains to today's income", () => {
    const result = leverage(70_000, [
      { code: "A", gain: 30_000 },
      { code: "B", gain: 20_000 },
      { code: "C", gain: 10_000 },
      { code: "D", gain: 99_999 },
    ])
    expect(result).toMatchObject({ extra: 60_000, projected: 130_000, reachesTarget: true })
    expect(result.steps).toHaveLength(3)
  })

  it("says when the target is still out of reach", () => {
    expect(leverage(40_000, [{ code: "A", gain: 10_000 }]).reachesTarget).toBe(false)
    expect(leverage(40_000, [])).toMatchObject({ extra: 0, projected: 40_000 })
  })
})
