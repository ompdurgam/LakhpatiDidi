import type { GeoLevel } from "./useGeo"

/** Heading for a level's list of areas (translated with tr()). */
export const levelLabel: Record<GeoLevel, string> = {
  state: "सभी राज्य",
  district: "सभी जिले",
  block: "सभी ब्लॉक",
  gram_panchayat: "सभी ग्राम पंचायतें",
  village: "सभी गाँव",
}

/** "{{n}} …" count of a level's areas, e.g. "93 ग्राम पंचायतें". */
export const countLabel: Record<GeoLevel, string> = {
  state: "{{n}} राज्य",
  district: "{{n}} जिले",
  block: "{{n}} ब्लॉक",
  gram_panchayat: "{{n}} ग्राम पंचायतें",
  village: "{{n}} गाँव",
}

const next: Partial<Record<GeoLevel, GeoLevel>> = {
  state: "district",
  district: "block",
  block: "gram_panchayat",
  gram_panchayat: "village",
}

/** The level below `level` (what each listed area contains). */
export const levelBelow = (level: GeoLevel) => next[level]
