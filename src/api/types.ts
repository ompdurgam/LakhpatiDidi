// Record shapes returned by the API (see server/index.ts).

export type ApplicationRow = {
  id: string
  name: string
  initials: string
  village: string
  scheme: string
  dept: string
  block: string
  days: number
  status: string
  statusCode: string
  overdue: boolean
  amount: string
  subsidy: string
  received: string
  hhCode: string
}

export type ApplicationDetail = ApplicationRow & {
  escalation: string
  slaDue: string
  daysToSla: number
  currentIncome: number
  projectedIncome: number
  expectedGain: number
  officer: string
  gpdpRef: string | null
  vprpRef: string | null
  sanction: { orderNo: string; date: string; amount: string } | null
  rejectionReason: string | null
  delivery: { date: string; asset: string; lat: number | null; lng: number | null } | null
  timeline: { label: string; date: string; state: string }[]
  documents: { name: string; verified: boolean }[]
  comments: {
    id: number
    author: string
    initials: string
    fromOfficer: boolean
    roleLabel: string
    body: string
    at: string
  }[]
}

export type HouseholdRow = {
  id: string
  name: string
  initials: string
  village: string
  shg: string
  vo: string
  clf: string
  income: number
  sources: number
  applications: number
  gaps: number
  updated: string
  status: string
  category: string
  special: string
  pld: boolean
}

export type Meta = {
  departments: { code: string; name: string }[]
  blocks: { code: string; name: string }[]
  villages: { code: string; name: string }[]
  clfs: string[]
  vos: string[]
  schemes: { code: string; name: string; department: string }[]
}

export type User = { id: number; name: string; role: string; designation: string; initials: string }
