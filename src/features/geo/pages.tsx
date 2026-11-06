import { GeoExplorer } from "./GeoExplorer"

// Each role's map opens on its own area (demo: Bastar district, Jagdalpur block).
export const DEFAULT_DISTRICT_LGD = "374"
export const DEFAULT_BLOCK_LGD = "3595"

export const StateMapPage = () => <GeoExplorer base="/state/map" root={["state", "CG"]} />
export const DistrictMapPage = () => (
  <GeoExplorer base="/district/map" root={["district", DEFAULT_DISTRICT_LGD]} />
)
export const BlockMapPage = () => (
  <GeoExplorer base="/block/map" root={["block", DEFAULT_BLOCK_LGD]} />
)
