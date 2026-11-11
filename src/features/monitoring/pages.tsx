import { AreaDashboard } from "./area/AreaDashboard"

// Every district / state menu item opens the live area dashboard; the map
// item opens the LGD map explorer.
export const DistrictPage = () => <AreaDashboard level="district" />
export const StatePage = () => <AreaDashboard level="state" />
