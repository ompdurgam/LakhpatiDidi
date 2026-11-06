// Loads a household with the facts the recommendation engine and the DPR need.
import { one, query } from "../../db/pool.ts"
import { initials } from "../../shared/format.ts"
import { localized, msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { lifecycleHi, type LifecycleStatus } from "../households/households.labels.ts"
import { sourceKind } from "./engine.ts"
import type { Profile } from "./types.ts"

export type Source = { name: string; net: number }

export type Household = {
  id: number
  code: string
  name: string
  initials: string
  guardian: string | null
  mobile: string | null
  category: string
  special: string
  village: string
  panchayat: string
  block: string
  blockId: number
  district: string
  shg: string | null
  vo: string | null
  income: number
  activeSources: number
  status: LifecycleStatus
  statusLabel: string
  sources: Source[]
}

const HOUSEHOLD_SQL = `
  SELECT h.id, h.hh_code, h.didi_name, h.didi_name_en, h.guardian_name, h.mobile, h.social_category,
         h.special_status, h.current_annual_income, h.active_income_sources, h.lifecycle_status,
         v.name_hi AS village, v.name_en AS village_en,
         gp.name_hi AS panchayat, gp.name_en AS panchayat_en,
         b.id AS block_id, b.name_hi AS block, b.name_en AS block_en,
         d.name_hi AS district, d.name_en AS district_en,
         shg.name AS shg, vo.name AS vo
  FROM tbl_households h
  JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id
  JOIN master_districts d        ON d.id  = b.district_id
  LEFT JOIN master_shgs shg                 ON shg.id = h.shg_id
  LEFT JOIN master_village_organisations vo ON vo.id  = shg.vo_id`

/** Income sources of the latest financial year, grouped by household id. */
export async function sourcesFor(householdIds: number[]) {
  const bySource = new Map<number, Source[]>()
  if (!householdIds.length) return bySource
  const rows = await query<Row>(
    `SELECT s.household_id, s.source_name, s.net_income
     FROM tbl_household_income_sources s
     WHERE s.household_id IN (?) AND s.gross_income > 0
       AND s.financial_year = (SELECT MAX(financial_year) FROM tbl_household_income_sources x
                               WHERE x.household_id = s.household_id)
     ORDER BY s.net_income DESC`,
    [householdIds],
  )
  for (const r of rows) {
    const list = bySource.get(r.household_id) ?? []
    list.push({ name: r.source_name, net: Number(r.net_income) })
    bySource.set(r.household_id, list)
  }
  return bySource
}

export const toHousehold = (r: Row, sources: Source[]): Household => ({
  id: r.id,
  code: r.hh_code,
  name: localized(r, "didi_name"),
  initials: initials(r.didi_name_en, r.didi_name),
  guardian: r.guardian_name ?? null,
  mobile: r.mobile ?? null,
  category: r.social_category,
  special: r.special_status,
  village: localized(r, "village"),
  panchayat: localized(r, "panchayat"),
  block: localized(r, "block"),
  blockId: r.block_id,
  district: localized(r, "district"),
  shg: r.shg ?? null,
  vo: r.vo ?? null,
  income: Number(r.current_annual_income),
  activeSources: Number(r.active_income_sources),
  status: r.lifecycle_status,
  statusLabel: msg(lifecycleHi[r.lifecycle_status as LifecycleStatus]),
  sources,
})

export async function loadHousehold(code: string): Promise<Household | undefined> {
  const r = await one<Row>(`${HOUSEHOLD_SQL} WHERE h.hh_code = ?`, [code])
  if (!r) return undefined
  const sources = (await sourcesFor([r.id])).get(r.id) ?? []
  return toHousehold(r, sources)
}

/** Surveyed households (newest survey first), optionally filtered by name / code / village. */
export async function loadSurveyed(search: string, limit = 300) {
  const like = `%${search.trim()}%`
  const rows = await query<Row>(
    `${HOUSEHOLD_SQL}
     WHERE h.surveyed_at IS NOT NULL
       AND (? = '%%' OR h.didi_name LIKE ? OR h.didi_name_en LIKE ? OR h.hh_code LIKE ? OR v.name_hi LIKE ? OR v.name_en LIKE ?)
     ORDER BY h.surveyed_at DESC, h.id DESC LIMIT ?`,
    [like, like, like, like, like, like, limit],
  )
  const sources = await sourcesFor(rows.map((r) => r.id))
  return rows.map((r) => toHousehold(r, sources.get(r.id) ?? []))
}

/** The engine's view of a household. */
export const toProfile = (h: Household): Profile => ({
  income: h.income,
  activeSources: h.activeSources,
  category: h.category,
  special: h.special,
  kinds: new Set(h.sources.map((s) => sourceKind(s.name))),
  block: h.block,
})
