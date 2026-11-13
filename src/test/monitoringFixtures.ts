// Fake /api/monitoring/overview payload for route and component tests.
import type { Trend } from "@/features/monitoring/district/useTrend"
import type { Overview } from "@/features/monitoring/useOverview"

export const overviewFixture: Overview = {
  area: { level: "block", code: "3595", name: "जगदलपुर", childLevel: "gram_panchayat" },
  areas: [{ level: "block", code: "3595", name: "जगदलपुर" }],
  totals: {
    households: 120,
    pld: 120,
    surveyed: 40,
    lakhpati: 6,
    threshold: 4,
    singleSource: 3,
    avgIncome: 72000,
    monthlyUpdated: 2,
  },
  funnel: {
    asked: 20,
    interested: 12,
    dpr: 8,
    sanctioned: 5,
    delivered: 3,
    incomeActive: 2,
    applications: 9,
    sanctionedApplications: 5,
    deliveredApplications: 3,
    overdue: 1,
    sanctionedAmount: 180000,
    activeDepartments: 2,
  },
  incomeBands: [10, 15, 9, 6],
  children: [
    { id: 1, code: "122027", name: "बड़ांजी", households: 80, pld: 80, surveyed: 30, lakhpati: 5 },
    { id: 2, code: "122028", name: "नानगुर", households: 40, pld: 40, surveyed: 10, lakhpati: 1 },
  ],
  candidates: [],
  departments: [
    {
      code: "FISH",
      name: "मत्स्य विभाग",
      received: 5,
      pending: 2,
      overdue: 1,
      sanctionedAmount: 120000,
      avgSanctionDays: 9.5,
      onTimePct: 80,
    },
  ],
  matrix: [{ dept: "FISH", childId: 1, sanctioned: 3, pending: 2, overdue: 1 }],
  escalations: [
    {
      code: "APP-260142",
      department: "मत्स्य विभाग",
      scheme: "PMMSY – तालाब",
      daysOverdue: 4,
      escalation: "none",
    },
  ],
  deadlines: { dueSoon: 1, awaitingDelivery: 2 },
  gaps: {
    open: 3,
    closed: 1,
    cells: [{ scheme: "PMAY", schemeName: "PM आवास", childId: 1, open: 3 }],
  },
  sectors: [{ name: "कृषि", households: 20 }],
  loans: [{ lender: "shg", amount: 50000, households: 4 }],
  surveyors: [{ name: "गीता नेताम", assigned: 120, submitted: 40, drafts: 2 }],
}

// Fake /api/monitoring/trend payload: 12 months, activity in the last few.
export const trendFixture: Trend = {
  months: Array.from({ length: 12 }, (_, i) => ({
    month: `2026-${String(i + 1).padStart(2, "0")}`,
    surveyed: i > 8 ? 10 * i : 0,
    received: i > 9 ? 3 : 0,
    sanctioned: i > 9 ? 2 : 0,
    delivered: i === 11 ? 1 : 0,
    sanctionedAmount: i > 9 ? 120000 : 0,
    gapsIdentified: i > 8 ? 4 : 0,
    gapsClosed: i === 11 ? 2 : 0,
    incomeReporters: i > 9 ? 6 : 0,
    avgMonthlyIncome: i > 9 ? 7500 + i * 100 : 0,
  })),
  before: { surveyed: 5, sanctioned: 1 },
}
