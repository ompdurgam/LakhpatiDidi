import { describe, expect, it } from "vitest"

import { bestMatch, normalise, pickByOverlap, similarity, socialCategory } from "./places.ts"
import { toPldRow } from "./sheet.ts"

describe("PLD place matching", () => {
  it("normalises names", () => {
    expect(normalise("Bade Kilepal-02")).toBe("BADEKILEPAL02")
    expect(normalise("A. CHOWKI")).toBe("ACHOWKI")
  })

  it("scores like difflib", () => {
    expect(similarity("ABC", "ABC")).toBe(1)
    expect(similarity("SIWAR", "SIYAR")).toBeCloseTo(0.8)
    expect(similarity("ABC", "XYZ")).toBe(0)
  })

  it("prefers exact, then a clear fuzzy winner", () => {
    const villages = new Map([
      ["CHARAIGODI", 1],
      ["TEKAPAR", 2],
    ])
    expect(bestMatch("TEKAPAR", villages)).toBe(2)
    expect(bestMatch("CHIRAIGODI", villages)).toBe(1)
    expect(bestMatch("FUNDA", villages)).toBeUndefined()
    // Two equally close candidates: no guess.
    expect(
      bestMatch(
        "BHARDA",
        new Map([
          ["BHARDAKHURD", 1],
          ["BHARDAKALAN", 2],
        ]),
      ),
    ).toBeUndefined()
  })

  it("picks the block sharing the most panchayats", () => {
    const options = [
      { id: "G1", name: "GAURELLA1", childNames: new Set(["AMARPUR", "KOTMI"]) },
      { id: "G2", name: "GAURELLA2", childNames: new Set(["SEMRA", "DHANPUR"]) },
    ]
    expect(pickByOverlap("PENDRA", new Set(["SEMRA", "DHANPUR", "X"]), options)).toBe("G2")
    expect(pickByOverlap("NOWHERE", new Set(["Y"]), options)).toBeUndefined()
  })

  it("maps social categories", () => {
    expect(socialCategory("GENERAL")).toBe("GEN")
    expect(socialCategory("OBC")).toBe("OBC")
    expect(socialCategory("OTHER")).toBe("OTHER")
  })
})

describe("PLD sheet rows", () => {
  const raw = {
    district: "BALOD",
    block: "BALOD",
    panchayat: "AMORA",
    village: "AMORA",
    name: " TUKESHWARI ",
    memberCode: 330034479857,
    shgName: "MINI MATA SHG",
    shgCode: 33003937088,
    guardian: "HEMLATA SAHU",
    category: "OBC",
  }

  it("cleans a row", () => {
    expect(toPldRow(raw)).toMatchObject({
      name: "TUKESHWARI",
      memberCode: "330034479857",
      shgCode: "33003937088",
    })
  })

  it("rejects rows without a usable PLD code", () => {
    expect(toPldRow({ ...raw, memberCode: "null" })).toBe('invalid PLD code "null"')
  })
})
