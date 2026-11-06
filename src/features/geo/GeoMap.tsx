import "leaflet/dist/leaflet.css"

import L from "leaflet"
import { useEffect, useMemo } from "react"
import { AttributionControl, GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet"

import { shade } from "./mapColors"
import type { GeoFeature } from "./useGeo"

// Optional basemap (e.g. Bhuvan or an approved tile server); without it the
// map shows the boundaries on a plain background.
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL as string | undefined
const TILE_ATTRIBUTION = (import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined) ?? ""

type Shape = GeoJSON.Polygon | GeoJSON.MultiPolygon

function FitBounds({ features, outline }: { features: GeoFeature[]; outline: Shape | null }) {
  const map = useMap()
  useEffect(() => {
    const data: GeoJSON.GeoJsonObject = features.length
      ? ({ type: "FeatureCollection", features } as GeoJSON.FeatureCollection)
      : (outline as GeoJSON.GeoJsonObject)
    if (!data) return
    const bounds = L.geoJSON(data).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] })
  }, [features, outline, map])
  return null
}

/**
 * Boundaries of the current area's children (click one to drill down), over
 * the area's own outline. `attribution` credits the boundary data (e.g. OSM).
 */
export function GeoMap({
  features,
  outline,
  attribution,
  stats,
  selected,
  onSelect,
}: {
  features: GeoFeature[]
  outline: Shape | null
  attribution: string
  stats: Map<string, { households: number; lakhpati: number }>
  selected?: string
  onSelect: (code: string) => void
}) {
  // A new key re-creates the layer when the data or selection changes.
  const layerKey = useMemo(
    () => `${features.map((f) => f.properties.code).join(",")}|${selected ?? ""}`,
    [features, selected],
  )
  return (
    <MapContainer
      className="geo-map"
      center={[21.3, 81.9]}
      zoom={6}
      zoomSnap={0.25}
      scrollWheelZoom
      attributionControl={false}
    >
      <AttributionControl prefix='<a href="https://leafletjs.com">Leaflet</a>' />
      {TILE_URL && <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />}
      {outline && (
        <GeoJSON
          key={`outline-${layerKey}`}
          data={outline}
          interactive={false}
          attribution={attribution}
          style={{
            color: "#174e31",
            weight: 2,
            dashArray: features.length ? "6 4" : undefined,
            fillColor: "#cfe3d4",
            fillOpacity: features.length ? 0 : 0.35,
          }}
        />
      )}
      <GeoJSON
        key={layerKey}
        data={{ type: "FeatureCollection", features } as GeoJSON.FeatureCollection}
        attribution={attribution}
        style={(feature) => {
          const code = feature?.properties?.code as string
          const s = stats.get(code)
          return {
            color: code === selected ? "#e7a72c" : "#174e31",
            weight: code === selected ? 3 : 1,
            fillColor: shade(s?.households ?? 0, s?.lakhpati ?? 0),
            fillOpacity: 0.75,
          }
        }}
        onEachFeature={(feature, layer) => {
          const code = feature.properties.code as string
          layer.bindTooltip(feature.properties.name as string, { sticky: true })
          layer.on({
            click: () => onSelect(code),
            mouseover: () => (layer as L.Path).setStyle({ weight: 3 }),
            mouseout: () => (layer as L.Path).setStyle({ weight: code === selected ? 3 : 1 }),
          })
        }}
      />
      <FitBounds features={features} outline={outline} />
    </MapContainer>
  )
}
