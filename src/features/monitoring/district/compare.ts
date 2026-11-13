// How one district stands against the state: its value, the state's, and its rank.
import { pct } from "../format"
import type { Overview } from "../useOverview"

export type Comparison = {
  key: string
  label: string
  /** Shown as "{{value}}{{unit}}". */
  unit: "%" | ""
  district: number
  state: number
  /** 1 = best. Null when the measure is not ranked across districts. */
  rank: number | null
  of: number
  /** Whether a lower value is better (overdue applications). */
  lowerIsBetter?: boolean
}

type PerDistrict = { id: number; code: string; value: number }

/** 1-based position of `code` once rows are ordered best first. */
export function rankOf(rows: PerDistrict[], code: string, lowerIsBetter = false) {
  const sorted = [...rows].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))
  const index = sorted.findIndex((r) => r.code === code)
  if (index < 0) return null
  // Ties share the better rank.
  const value = sorted[index].value
  return sorted.findIndex((r) => r.value === value) + 1
}

/** Applications per district, summed from the state's department × district matrix. */
function matrixTotals(state: Overview) {
  const out = new Map<number, { sanctioned: number; pending: number; overdue: number }>()
  for (const m of state.matrix) {
    const t = out.get(m.childId) ?? { sanctioned: 0, pending: 0, overdue: 0 }
    t.sanctioned += m.sanctioned
    t.pending += m.pending
    t.overdue += m.overdue
    out.set(m.childId, t)
  }
  return out
}

/** The district's headline measures beside the state figure and its rank among districts. */
export function compareWithState(district: Overview, state: Overview): Comparison[] {
  const code = district.area.code
  const districts = state.children
  const of = districts.length
  const apps = matrixTotals(state)
  const per = (value: (c: Overview["children"][number]) => number): PerDistrict[] =>
    districts.map((c) => ({ id: c.id, code: c.code, value: value(c) }))
  const appsOf = (id: number) => apps.get(id) ?? { sanctioned: 0, pending: 0, overdue: 0 }
  const d = district.totals
  const s = state.totals
  const df = district.funnel
  const sf = state.funnel
  const rows: Comparison[] = [
    {
      key: "coverage",
      label: "सर्वे कवरेज",
      unit: "%",
      district: pct(d.surveyed, d.households),
      state: pct(s.surveyed, s.households),
      rank: rankOf(
        per((c) => pct(c.surveyed, c.households)),
        code,
      ),
      of,
    },
    {
      key: "lakhpatiPct",
      label: "लखपति दर (सर्वेक्षित में)",
      unit: "%",
      district: pct(d.lakhpati, d.surveyed),
      state: pct(s.lakhpati, s.surveyed),
      rank: rankOf(
        per((c) => (c.surveyed ? c.lakhpati / c.surveyed : 0)),
        code,
      ),
      of,
    },
    {
      key: "lakhpati",
      label: "लखपति दीदी",
      unit: "",
      district: d.lakhpati,
      state: of ? Math.round(s.lakhpati / of) : 0,
      rank: rankOf(
        per((c) => c.lakhpati),
        code,
      ),
      of,
    },
    {
      key: "pld",
      label: "PLD सूची का आकार",
      unit: "",
      district: d.pld,
      state: of ? Math.round(s.pld / of) : 0,
      rank: rankOf(
        per((c) => c.pld),
        code,
      ),
      of,
    },
    {
      key: "sanctioned",
      label: "स्वीकृत आवेदन",
      unit: "",
      district: df.sanctionedApplications,
      state: of ? Math.round(sf.sanctionedApplications / of) : 0,
      rank: rankOf(
        per((c) => appsOf(c.id).sanctioned),
        code,
      ),
      of,
    },
    {
      key: "overdue",
      label: "अतिदेय आवेदन",
      unit: "",
      district: df.overdue,
      state: of ? Math.round(sf.overdue / of) : 0,
      rank: rankOf(
        per((c) => appsOf(c.id).overdue),
        code,
        true,
      ),
      of,
      lowerIsBetter: true,
    },
    {
      key: "sanctionRate",
      label: "स्वीकृति दर (आवेदनों में)",
      unit: "%",
      district: pct(df.sanctionedApplications, df.applications),
      state: pct(sf.sanctionedApplications, sf.applications),
      rank: null,
      of,
    },
    {
      key: "deliveryRate",
      label: "वितरण दर (स्वीकृत में)",
      unit: "%",
      district: pct(df.deliveredApplications, df.sanctionedApplications),
      state: pct(sf.deliveredApplications, sf.sanctionedApplications),
      rank: null,
      of,
    },
    {
      key: "avgIncome",
      label: "औसत वार्षिक आय (₹)",
      unit: "",
      district: d.avgIncome,
      state: s.avgIncome,
      rank: null,
      of,
    },
    {
      key: "gapsClosed",
      label: "हकदारी गैप बंद",
      unit: "%",
      district: pct(district.gaps.closed, district.gaps.open + district.gaps.closed),
      state: pct(state.gaps.closed, state.gaps.open + state.gaps.closed),
      rank: null,
      of,
    },
  ]
  return rows
}

/** Whether the district does better than the state figure (state average for counts). */
export const ahead = (c: Comparison) =>
  c.lowerIsBetter ? c.district <= c.state : c.district >= c.state
