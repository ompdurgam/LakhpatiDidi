import { useLocation } from "react-router"

import { AreaDashboard, type AreaSection } from "./area/AreaDashboard"

/** Menu path segment → page (/state/districts, /district/lakhpati-gram…). */
const SECTIONS: Record<string, AreaSection> = {
  districts: "areas",
  blocks: "areas",
  departments: "departments",
  certification: "certification",
  "lakhpati-gram": "certification",
  escalations: "escalations",
  reports: "reports",
}

function useSection(): AreaSection {
  const segment = useLocation().pathname.split("/")[2] ?? ""
  return SECTIONS[segment] ?? "overview"
}

export function DistrictPage() {
  const section = useSection()
  return <AreaDashboard key={section} level="district" section={section} />
}

export function StatePage() {
  const section = useSection()
  return <AreaDashboard key={section} level="state" section={section} />
}

export { DistrictProfile as StateDistrictPage } from "./district/DistrictProfile"
