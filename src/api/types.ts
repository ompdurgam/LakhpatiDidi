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
  /** `active`: has surveyed households or applications (used by list filters). */
  blocks: { code: string; name: string; active: boolean }[]
  villages: { code: string; name: string }[]
  clfs: string[]
  vos: string[]
  schemes: { code: string; name: string; department: string }[]
}

/** The district / block a user works in; empty for state and admin accounts. */
export type UserScope = {
  districtLgd: string | null
  districtHi: string | null
  districtEn: string | null
  blockLgd: string | null
  blockHi: string | null
  blockEn: string | null
}

export type User = {
  id: number
  name: string
  role: string
  designation: string
  initials: string
  /** Missing for sessions saved before scopes existed (they fall back to the whole state). */
  scope?: UserScope
  /** Every role this account holds (missing for sessions saved before multi-role accounts). */
  roles?: string[]
  assignments?: UserAssignment[]
}

/** One role over one area (the state, or a district / block / GP / village). */
export type UserAssignment = {
  role: string
  level: string
  areaCode: string | null
  areaName: string
  departmentCode: string | null
  departmentName: string | null
}
