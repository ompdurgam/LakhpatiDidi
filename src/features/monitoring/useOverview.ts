import { useQuery } from "@tanstack/react-query"

import { api } from "@/api/client"
import { useSession } from "@/stores/session"

export type DashLevel = "state" | "district" | "block"

export type ChildArea = {
  id: number
  code: string
  name: string
  households: number
  pld: number
  surveyed: number
  lakhpati: number
}

export type DepartmentRow = {
  code: string
  name: string
  received: number
  pending: number
  overdue: number
  sanctionedAmount: number
  avgSanctionDays: number | null
  onTimePct: number | null
}

/** One dashboard's live figures (GET /api/monitoring/overview). */
export type Overview = {
  area: { level: DashLevel; code: string; name: string; childLevel: string }
  /** Every dashboard area the user covers in this role (more than one → area picker). */
  areas: { level: DashLevel; code: string; name: string }[]
  totals: {
    households: number
    pld: number
    surveyed: number
    lakhpati: number
    threshold: number
    singleSource: number
    avgIncome: number
    monthlyUpdated: number
  }
  funnel: {
    asked: number
    interested: number
    dpr: number
    sanctioned: number
    delivered: number
    incomeActive: number
    applications: number
    sanctionedApplications: number
    deliveredApplications: number
    overdue: number
    sanctionedAmount: number
    activeDepartments: number
  }
  /** Surveyed households by annual income: <50K, 50–80K, 80K–1L, 1L+. */
  incomeBands: [number, number, number, number]
  children: ChildArea[]
  candidates: {
    code: string
    name: string
    block: string
    pld: number
    surveyed: number
    lakhpatiPct: number
  }[]
  departments: DepartmentRow[]
  matrix: { dept: string; childId: number; sanctioned: number; pending: number; overdue: number }[]
  escalations: {
    code: string
    department: string
    scheme: string
    daysOverdue: number
    escalation: string
  }[]
  deadlines: { dueSoon: number; awaitingDelivery: number }
  gaps: {
    open: number
    closed: number
    cells: { scheme: string; schemeName: string; childId: number; open: number }[]
  }
  sectors: { name: string; households: number }[]
  loans: { lender: string; amount: number; households: number }[]
  surveyors: { name: string; assigned: number; submitted: number; drafts: number }[]
}

/** The signed-in user's dashboard (their own block / district / the state), or a given area inside it. */
export function useOverview(area?: { level: DashLevel; code: string }) {
  const signedIn = useSession((s) => Boolean(s.token))
  const search = area ? `?level=${area.level}&code=${encodeURIComponent(area.code)}` : ""
  return useQuery({
    queryKey: ["monitoring", "overview", area?.level ?? "", area?.code ?? ""],
    queryFn: () => api<Overview>(`/monitoring/overview${search}`),
    enabled: signedIn,
    staleTime: 60_000,
  })
}
