import { one, query } from "../../db/pool.ts"
import { initials, inr } from "../../shared/format.ts"
import { localized, msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { toApplicationRow } from "../applications/applications.mapper.ts"
import {
  LAKHPATI_INCOME,
  lifecycleHi,
  type LifecycleStatus,
} from "../households/households.labels.ts"
import { buildTasks, progress } from "./didi.tasks.ts"

/** Income at which a Didi is "on the threshold" of Lakhpati. */
const THRESHOLD_INCOME = 80_000

/**
 * The signed-in Didi's own profile, found by her verified mobile number.
 * Returns null when no household carries that number (e.g. a staff member).
 */
export async function getDidiProfile(mobile: string) {
  const h = await one<Row>(
    `SELECT h.id, h.hh_code, h.didi_name, h.didi_name_en, h.guardian_name, h.age, h.mobile,
            h.social_category, h.special_status, h.is_pld, h.current_annual_income,
            h.active_income_sources, h.lifecycle_status, h.surveyed_at,
            v.name_hi AS village, v.name_en AS village_en,
            gp.name_hi AS panchayat, gp.name_en AS panchayat_en,
            b.name_hi AS block, b.name_en AS block_en,
            d.name_hi AS district, d.name_en AS district_en,
            shg.name AS shg, vo.name AS vo, c.name AS clf
     FROM tbl_households h
     JOIN master_villages v         ON v.id  = h.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b           ON b.id  = gp.block_id
     JOIN master_districts d        ON d.id  = b.district_id
     LEFT JOIN master_shgs shg                 ON shg.id = h.shg_id
     LEFT JOIN master_village_organisations vo ON vo.id  = shg.vo_id
     LEFT JOIN master_clfs c                   ON c.id   = vo.clf_id
     WHERE h.mobile = ? LIMIT 1`,
    [mobile],
  )
  if (!h) return null

  const [sources, gaps, applications] = await Promise.all([
    query<Row>(
      `SELECT source_name, months_active, gross_income, cost, net_income
       FROM tbl_household_income_sources
       WHERE household_id = ? AND gross_income > 0
         AND financial_year = (SELECT MAX(financial_year) FROM tbl_household_income_sources
                               WHERE household_id = ?)
       ORDER BY net_income DESC`,
      [h.id, h.id],
    ),
    query<Row>(
      `SELECT g.status, g.identified_on, s.code, s.name_hi AS name, s.name_en,
              d.name_hi AS department, d.name_en AS department_en
       FROM tbl_entitlement_gaps g
       JOIN master_schemes s ON s.id = g.scheme_id
       JOIN master_departments d ON d.id = s.department_id
       WHERE g.household_id = ? ORDER BY g.status, g.identified_on DESC`,
      [h.id],
    ),
    query<Row>(
      "SELECT * FROM v_application_list WHERE hh_code = ? ORDER BY received_on DESC, app_code DESC",
      [h.hh_code],
    ),
  ])

  const income = Number(h.current_annual_income)
  const appRows = applications.map(toApplicationRow)
  const gapRows = gaps.map((r) => ({
    code: r.code as string,
    name: localized(r, "name"),
    department: localized(r, "department"),
    open: r.status === "open",
    identifiedOn: String(r.identified_on).slice(0, 10),
  }))
  const tasks = buildTasks({
    income,
    target: LAKHPATI_INCOME,
    activeSources: Number(h.active_income_sources),
    gaps: gapRows,
    applications: appRows,
  })
  return {
    profile: {
      code: h.hh_code as string,
      name: localized(h, "didi_name"),
      initials: initials(h.didi_name_en, h.didi_name),
      guardian: (h.guardian_name as string | null) ?? null,
      age: h.age === null ? null : Number(h.age),
      mobile: h.mobile as string,
      category: h.social_category as string,
      special: h.special_status === "NONE" ? null : (h.special_status as string),
      pld: Boolean(h.is_pld),
      village: localized(h, "village"),
      panchayat: localized(h, "panchayat"),
      block: localized(h, "block"),
      district: localized(h, "district"),
      shg: (h.shg as string | null) ?? null,
      vo: (h.vo as string | null) ?? null,
      clf: (h.clf as string | null) ?? null,
    },
    meter: {
      income,
      target: LAKHPATI_INCOME,
      threshold: THRESHOLD_INCOME,
      remaining: Math.max(0, LAKHPATI_INCOME - income),
      percent: Math.min(100, Math.round((income / LAKHPATI_INCOME) * 100)),
      status: h.lifecycle_status as LifecycleStatus,
      statusLabel: msg(lifecycleHi[h.lifecycle_status as LifecycleStatus]),
      activeSources: Number(h.active_income_sources),
    },
    incomeSources: sources.map((r) => ({
      name: r.source_name as string,
      months: String(r.months_active || "")
        .split(",")
        .filter(Boolean),
      gross: Number(r.gross_income),
      cost: Number(r.cost),
      net: Number(r.net_income),
      netLabel: inr(r.net_income),
    })),
    gaps: gapRows,
    applications: appRows,
    tasks: { items: tasks, ...progress(tasks) },
  }
}
