// Month-by-month activity in an area, for the growth charts on a district profile.
import { query } from "../../db/pool.ts"
import type { Row } from "../../shared/types.ts"
import type { Area } from "./monitoring.area.ts"

const AREA_HOUSEHOLDS = `tbl_households h
  JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id`
const AREA_APPS = `tbl_applications a JOIN master_blocks b ON b.id = a.block_id`

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
  /** Didis with a monthly income entry that month, and their average total income. */
  incomeReporters: number
  avgMonthlyIncome: number
}

/** "YYYY-MM" for the last `months` months, oldest first, ending with the current one. */
export function monthKeys(months: number, today = new Date()) {
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getFullYear(), today.getMonth() - i, 1))
    keys.push(d.toISOString().slice(0, 7))
  }
  return keys
}

/** Count rows of `table` per month of `dateColumn` since `start`, keyed "YYYY-MM". */
async function perMonth(
  area: Area,
  from: string,
  dateColumn: string,
  select: string,
  start: string,
) {
  const rows = await query<Row>(
    `SELECT DATE_FORMAT(${dateColumn}, '%Y-%m') AS m, ${select}
     FROM ${from}
     WHERE ${area.blockFilter} AND ${dateColumn} >= ?
     GROUP BY m`,
    [...area.params, start],
  )
  return new Map(rows.map((r) => [r.m as string, r]))
}

/** Monthly series for the area, plus the totals from before the window (for cumulative lines). */
export async function areaTrend(area: Area, months = 12) {
  const keys = monthKeys(months)
  const start = `${keys[0]}-01`
  const [surveys, received, sanctioned, delivered, gapsOpened, gapsClosed, income, before] =
    await Promise.all([
      perMonth(area, AREA_HOUSEHOLDS, "h.surveyed_at", "COUNT(*) AS n", start),
      perMonth(area, AREA_APPS, "a.received_on", "COUNT(*) AS n", start),
      perMonth(
        area,
        AREA_APPS,
        "a.sanction_date",
        "COUNT(*) AS n, SUM(COALESCE(a.sanctioned_amount, a.subsidy_amount)) AS amount",
        start,
      ),
      perMonth(area, AREA_APPS, "a.delivered_on", "COUNT(*) AS n", start),
      perMonth(
        area,
        `tbl_entitlement_gaps g JOIN ${AREA_HOUSEHOLDS} ON h.id = g.household_id`,
        "g.identified_on",
        "COUNT(*) AS n",
        start,
      ),
      perMonth(
        area,
        `tbl_entitlement_gaps g JOIN ${AREA_HOUSEHOLDS} ON h.id = g.household_id`,
        "g.closed_on",
        "COUNT(*) AS n",
        start,
      ),
      // Each Didi's total for the month first, then the average across Didis.
      query<Row>(
        `SELECT DATE_FORMAT(t.month, '%Y-%m') AS m, COUNT(*) AS n, AVG(t.total) AS avg_income
         FROM (SELECT m.household_id, m.month, SUM(m.amount) AS total
               FROM tbl_monthly_income_entries m JOIN ${AREA_HOUSEHOLDS} ON h.id = m.household_id
               WHERE ${area.blockFilter} AND m.month >= ?
               GROUP BY m.household_id, m.month) t
         GROUP BY m`,
        [...area.params, start],
      ).then((rows) => new Map(rows.map((r) => [r.m as string, r]))),
      query<Row>(
        `SELECT (SELECT COUNT(*) FROM ${AREA_HOUSEHOLDS}
                 WHERE ${area.blockFilter} AND h.surveyed_at < ?) AS surveyed,
                (SELECT COUNT(*) FROM ${AREA_APPS}
                 WHERE ${area.blockFilter} AND a.sanction_date < ?) AS sanctioned`,
        [...area.params, start, ...area.params, start],
      ),
    ])
  const n = (map: Map<string, Row>, key: string, field = "n") => Number(map.get(key)?.[field] ?? 0)
  const points: TrendPoint[] = keys.map((m) => ({
    month: m,
    surveyed: n(surveys, m),
    received: n(received, m),
    sanctioned: n(sanctioned, m),
    delivered: n(delivered, m),
    sanctionedAmount: n(sanctioned, m, "amount"),
    gapsIdentified: n(gapsOpened, m),
    gapsClosed: n(gapsClosed, m),
    incomeReporters: n(income, m),
    avgMonthlyIncome: Math.round(n(income, m, "avg_income")),
  }))
  return {
    months: points,
    before: {
      surveyed: Number(before[0]?.surveyed ?? 0),
      sanctioned: Number(before[0]?.sanctioned ?? 0),
    },
  }
}

export type AreaTrend = Awaited<ReturnType<typeof areaTrend>>
