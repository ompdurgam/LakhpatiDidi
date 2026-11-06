import { useSession } from "@/stores/session"

import { GeoExplorer } from "./GeoExplorer"
import type { GeoLevel } from "./useGeo"

// Each map opens on the signed-in user's own area; with no district / block on the
// account (or a session from before scopes existed) it opens on the whole state.
const STATE: [GeoLevel, string] = ["state", "CG"]

export const StateMapPage = () => <GeoExplorer base="/state/map" root={STATE} />

export function DistrictMapPage() {
  const code = useSession((s) => s.user?.scope?.districtLgd)
  return <GeoExplorer base="/district/map" root={code ? ["district", code] : STATE} />
}

export function BlockMapPage() {
  const scope = useSession((s) => s.user?.scope)
  const root: [GeoLevel, string] = scope?.blockLgd
    ? ["block", scope.blockLgd]
    : scope?.districtLgd
      ? ["district", scope.districtLgd]
      : STATE
  return <GeoExplorer base="/block/map" root={root} />
}
