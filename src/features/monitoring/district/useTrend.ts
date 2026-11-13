import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { api } from "@/api/client"
import { useSession } from "@/stores/session"

import type { DashLevel } from "../useOverview"

export type TrendPoint = {
  /** "2026-11" */
  month: string
  surveyed: number
  received: number
  sanctioned: number
  delivered: number
  sanctionedAmount: number
  gapsIdentified: number
  gapsClosed: number
  incomeReporters: number
  avgMonthlyIncome: number
}

/** Month-by-month activity (GET /api/monitoring/trend). */
export type Trend = {
  months: TrendPoint[]
  /** Totals from before the first month, so cumulative lines start at the right height. */
  before: { surveyed: number; sanctioned: number }
}

/** The last 12 months of activity in an area. */
export function useTrend(area: { level: DashLevel; code: string }) {
  const signedIn = useSession((s) => Boolean(s.token))
  return useQuery({
    queryKey: ["monitoring", "trend", area.level, area.code],
    queryFn: () => api<Trend>(`/monitoring/trend?level=${area.level}&code=${area.code}`),
    enabled: signedIn,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
}
