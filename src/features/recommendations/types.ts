export type SurveyedDidi = {
  code: string
  name: string
  initials: string
  village: string
  income: number
  status: string
  statusLabel: string
  recommended: number
  topScheme: string | null
  extraIncome: number
  reachesTarget: boolean
  applied: number
}

export type DprState = "draft" | "filled" | "sent" | null

export type SchemeFit = {
  code: string
  name: string
  department: string
  gain: number
  score: number
  why: string
  checks: [boolean, string][]
  docs: string[]
  office: string
  subsidyPercent: number
  maxCost: number
  maxSubsidy: number
  dpr: DprState
  /** The Didi's answer when asked on her phone (null = not asked yet). */
  interest: "asked" | "interested" | "not_interested" | null
}

export type DidiRecommendations = {
  household: {
    code: string
    name: string
    initials: string
    village: string
    income: number
    status: string
    statusLabel: string
    category: string
    special: string | null
    sources: { name: string; net: number }[]
  }
  leverage: {
    current: number
    target: number
    extra: number
    projected: number
    reachesTarget: boolean
    steps: { code: string; gain: number; name: string }[]
  }
  recommendations: SchemeFit[]
  entitlements: { code: string; name: string; department: string; since: string }[]
  applied: { id: string; status: string; scheme: string }[]
}
