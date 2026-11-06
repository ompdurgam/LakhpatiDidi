import { useQuery } from "@tanstack/react-query"

import { api } from "@/api/client"
import { useSession } from "@/stores/session"

export const GEO_LEVELS = ["state", "district", "block", "gram_panchayat", "village"] as const
export type GeoLevel = (typeof GEO_LEVELS)[number]

export type AreaRef = { level: GeoLevel; code: string; name: string }

export type ChildArea = {
  code: string | null
  name: string
  bodyType: string | null
  childCount: number
  households: number
  lakhpati: number
  hasBoundary: boolean
}

export type GeoFeature = {
  type: "Feature"
  properties: { code: string; name: string }
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export type AreaResponse = {
  path: AreaRef[]
  childLevel: GeoLevel
  children: ChildArea[]
  boundaries: { type: "FeatureCollection"; features: GeoFeature[] }
  outline: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  sources: string[]
}

export type VillageResponse = {
  path: AreaRef[]
  households: number
  lakhpati: number
  pld: number
  avgIncome: number
  shgs: number
  boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
}

export const isGeoLevel = (value: unknown): value is GeoLevel =>
  GEO_LEVELS.includes(value as GeoLevel)

/** An area with its children (and their boundaries, if imported). */
export function useGeoArea(level: GeoLevel, code: string) {
  const signedIn = useSession((s) => Boolean(s.token))
  return useQuery({
    queryKey: ["geo", "area", level, code],
    queryFn: () => api<AreaResponse>(`/geo/areas/${level}/${encodeURIComponent(code)}`),
    enabled: signedIn && level !== "village",
    staleTime: 5 * 60_000,
  })
}

export function useVillage(code: string | undefined) {
  const signedIn = useSession((s) => Boolean(s.token))
  return useQuery({
    queryKey: ["geo", "village", code],
    queryFn: () => api<VillageResponse>(`/geo/villages/${encodeURIComponent(code!)}`),
    enabled: signedIn && Boolean(code),
    staleTime: 5 * 60_000,
  })
}
