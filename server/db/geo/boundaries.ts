// Pure helpers for importing boundary polygons (GeoJSON) keyed by LGD code.

export const LEVELS = ["state", "district", "block", "gram_panchayat", "village"] as const
export type Level = (typeof LEVELS)[number]

type Position = number[]
export type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }

type Feature = { type: "Feature"; properties: Record<string, unknown> | null; geometry: unknown }

/** Rounds coordinates (5 decimals ≈ 1 m) to keep stored GeoJSON small. */
export function roundGeometry(geometry: Geometry, decimals = 5): Geometry {
  const f = 10 ** decimals
  const round = (p: Position) => p.slice(0, 2).map((n) => Math.round(n * f) / f)
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: geometry.coordinates.map((ring) => ring.map(round)) }
    : {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((poly) => poly.map((ring) => ring.map(round))),
      }
}

const isPolygon = (g: unknown): g is Geometry =>
  !!g &&
  typeof g === "object" &&
  ["Polygon", "MultiPolygon"].includes((g as { type?: string }).type ?? "") &&
  Array.isArray((g as { coordinates?: unknown }).coordinates)

/** LGD codes are numeric strings; "0449421", 449421 and "449421" are the same. */
export const normaliseCode = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/^0+(?=\d)/, "")

/**
 * Features → { code, geometry } using `codeField` (case-insensitive property
 * name). Returns skipped features with a reason so the import can report them.
 */
export function prepareFeatures(collection: unknown, codeField: string) {
  const features = (collection as { features?: Feature[] })?.features
  if (!Array.isArray(features)) throw new Error("Not a GeoJSON FeatureCollection")
  const field = codeField.toLowerCase()
  const ready: { code: string; geometry: Geometry }[] = []
  const skipped: { index: number; reason: string }[] = []
  features.forEach((feature, index) => {
    const props = feature.properties ?? {}
    const entry = Object.entries(props).find(([k]) => k.toLowerCase() === field)
    const code = normaliseCode(entry?.[1])
    if (!code) return skipped.push({ index, reason: `no "${codeField}" property` })
    if (!isPolygon(feature.geometry))
      return skipped.push({ index, reason: "geometry is not a Polygon/MultiPolygon" })
    ready.push({ code, geometry: roundGeometry(feature.geometry) })
  })
  return { ready, skipped }
}
