import type { SchemeFit } from "@/features/recommendations/types"

export type BoardState = "filled" | "draft" | "todo" | "done"

export type DprBoardData = {
  kpis: { didis: number; todo: number; draft: number; filled: number; sent: number }
  items: {
    code: string
    name: string
    initials: string
    village: string
    income: number
    state: BoardState
    scheme: { code: string; name: string; department: string } | null
    step: number | null
    expectedGain: number | null
    drafts: number
    filled: number
    sent: number
  }[]
}

export type CostItem = { item: string; quantity: string; amount: number }
export type Money = { total: number; subsidy: number; bank: number; own: number }

export type DprData = {
  household: {
    code: string
    name: string
    initials: string
    guardian: string | null
    mobile: string
    category: string
    special: string | null
    village: string
    panchayat: string
    block: string
    district: string
    shg: string | null
    vo: string | null
    income: number
  }
  scheme: {
    code: string
    name: string
    department: string
    subsidyPercent: number
    maxCost: number
    slaDays: number
    office: string
  }
  fit: Pick<SchemeFit, "score" | "why" | "checks" | "docs" | "gain">
  economics: {
    income: number
    gain: number
    projected: number
    reachesTarget: boolean
    paybackMonths: number | null
    monthlyLoan: number
  }
  money: Money
  draft: {
    status: "new" | "draft" | "filled" | "sent"
    step: number
    items: CostItem[]
    remarks: string
    documents: string[]
  }
  application: { code: string; status: string } | null
}

export type SentDpr = {
  applicationCode: string
  department: string
  office: string
  officer: string | null
  slaDue: string
  scheme: string
  didi: string
}
