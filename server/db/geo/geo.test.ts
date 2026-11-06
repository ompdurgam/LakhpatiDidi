import { describe, expect, it } from "vitest"

import { normaliseCode, prepareFeatures, roundGeometry } from "./boundaries.ts"
import { buildHierarchy, displayName, type LgdRow, parseCsv } from "./lgd.ts"

const row = (over: Partial<LgdRow>): LgdRow => ({
  district_code: "374",
  district_name: "BASTAR",
  block_code: "3595",
  block_name: "JAGDALPUR",
  local_body_code: "122042",
  local_body_name: "DHURGUDA",
  local_body_type: "Village Panchayat",
  village_code: "449068",
  village_name: "Dhurguda",
  ...over,
})

describe("LGD parsing", () => {
  it("parses quoted CSV", () => {
    const rows = parseCsv('a,b\r\n1,"x, ""y"""\n2,z\n')
    expect(rows).toEqual([
      { a: "1", b: 'x, "y"' },
      { a: "2", b: "z" },
    ])
  })

  it("title-cases upper-case names and keeps mixed case", () => {
    expect(displayName("BADE DEVDA")).toBe("Bade Devda")
    expect(displayName("JANJGIR-CHAMPA")).toBe("Janjgir-Champa")
    expect(displayName("Gaurella Pendra Marwahi")).toBe("Gaurella Pendra Marwahi")
  })

  it("builds a unique hierarchy, preferring the village panchayat", () => {
    const tree = buildHierarchy([
      row({ local_body_code: "900", local_body_name: "TOWN", local_body_type: "Municipality" }),
      row({}),
      row({ village_code: "449069", village_name: "Palli" }),
    ])
    expect(tree.districts).toEqual([{ code: "374", name: "Bastar", parent: "CG" }])
    expect(tree.blocks).toHaveLength(1)
    expect(tree.villages).toHaveLength(2)
    expect(tree.villages.find((v) => v.code === "449068")?.parent).toBe("122042")
  })
})

describe("boundary import", () => {
  const square = {
    type: "Polygon",
    coordinates: [
      [
        [81.1234567, 19.1234567],
        [81.2, 19.1],
        [81.2, 19.2],
        [81.1234567, 19.1234567],
      ],
    ],
  }

  it("normalises LGD codes", () => {
    expect(normaliseCode(" 0449068 ")).toBe("449068")
    expect(normaliseCode(374)).toBe("374")
  })

  it("rounds coordinates to 5 decimals", () => {
    const g = roundGeometry(square as never)
    expect(g.coordinates[0][0]).toEqual([81.12346, 19.12346])
  })

  it("keeps polygons with a code and reports the rest", () => {
    const { ready, skipped } = prepareFeatures(
      {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { VILLAGE_LGD: "449068" }, geometry: square },
          { type: "Feature", properties: {}, geometry: square },
          { type: "Feature", properties: { village_lgd: 1 }, geometry: { type: "Point" } },
        ],
      },
      "village_lgd",
    )
    expect(ready.map((f) => f.code)).toEqual(["449068"])
    expect(skipped.map((s) => s.index)).toEqual([1, 2])
  })

  it("rejects non-FeatureCollection input", () => {
    expect(() => prepareFeatures({}, "x")).toThrow("FeatureCollection")
  })
})
