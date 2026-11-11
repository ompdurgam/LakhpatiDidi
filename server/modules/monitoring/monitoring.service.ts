// Assembles one dashboard (block, district or state) from live data.
import type { SessionUser } from "../../shared/types.ts"
import {
  applicationFunnel,
  deadlines,
  departmentMatrix,
  departmentPerformance,
  escalations,
} from "./monitoring.applications.ts"
import { CHILD_LEVEL, dashboardAreas, type DashLevel, resolveArea } from "./monitoring.area.ts"
import {
  entitlementGaps,
  householdFigures,
  loans,
  monthlyUpdates,
  sectors,
  surveyors,
} from "./monitoring.households.ts"

export async function overview(user: SessionUser, requested?: { level: DashLevel; code: string }) {
  const area = await resolveArea(user, requested)
  // Every area the user covers in this role, for the dashboard's area picker.
  const own = (await dashboardAreas(user)).map((a) => ({
    level: a.level,
    code: a.code,
    name: a.name,
  }))
  const [
    households,
    funnel,
    departments,
    matrix,
    overdue,
    due,
    gaps,
    sectorRows,
    loanRows,
    crps,
    updated,
  ] = await Promise.all([
    householdFigures(area),
    applicationFunnel(area),
    departmentPerformance(area),
    departmentMatrix(area),
    escalations(area),
    deadlines(area),
    entitlementGaps(area),
    sectors(area),
    loans(area),
    surveyors(area),
    monthlyUpdates(area),
  ])
  return {
    area: {
      level: area.level,
      code: area.code,
      name: area.name,
      childLevel: CHILD_LEVEL[area.level],
    },
    areas: own,
    totals: { ...households.totals, monthlyUpdated: updated },
    funnel,
    incomeBands: households.incomeBands,
    children: households.children,
    candidates: households.candidates,
    departments,
    matrix,
    escalations: overdue,
    deadlines: due,
    gaps,
    sectors: sectorRows,
    loans: loanRows,
    surveyors: crps,
  }
}

export type Overview = Awaited<ReturnType<typeof overview>>
