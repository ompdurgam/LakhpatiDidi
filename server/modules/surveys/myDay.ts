// The CRP's "My day": everything waiting on her in her own areas.
import { one, query } from "../../db/pool.ts"
import { localized, localizedName } from "../../shared/i18n.ts"
import type { Row, SessionUser } from "../../shared/types.ts"
import { areaOf } from "./surveyList.ts"

const PLACE = `JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id`

const LIST = 8

export async function myDay(user: SessionUser) {
  const area = await areaOf(user)
  const where = area.sql
  const p = area.params
  const [counts, incomeDue, infoRequested, dprs] = await Promise.all([
    one<Row>(
      `SELECT SUM(h.surveyed_at IS NULL) AS to_survey,
              SUM(h.surveyed_at >= CURDATE()) AS surveyed_today,
              SUM(h.surveyed_at >= CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY) AS surveyed_week
       FROM tbl_households h ${PLACE} WHERE ${where}`,
      p,
    ),
    // Surveyed Didis with no income entry for this month yet.
    query<Row>(
      `SELECT h.hh_code, h.didi_name, h.didi_name_en, v.name_hi AS village, v.name_en AS village_en,
              COUNT(*) OVER () AS total
       FROM tbl_households h ${PLACE}
       WHERE ${where} AND h.surveyed_at IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM tbl_monthly_income_entries m
                         WHERE m.household_id = h.id AND m.month = DATE_FORMAT(CURDATE(), '%Y-%m-01'))
       ORDER BY h.surveyed_at LIMIT ${LIST}`,
      p,
    ),
    // A department asked for more information on one of her Didis' applications.
    query<Row>(
      `SELECT a.app_code, h.hh_code, h.didi_name, h.didi_name_en, s.code AS scheme, s.name_hi AS scheme_hi,
              s.name_en AS scheme_en, d.name_hi AS dept_hi, d.name_en AS dept_en,
              (SELECT c.body FROM tbl_application_comments c
               WHERE c.application_id = a.id ORDER BY c.id DESC LIMIT 1) AS last_comment
       FROM tbl_applications a
       JOIN tbl_households h ON h.id = a.household_id ${PLACE}
       JOIN master_schemes s     ON s.id = a.scheme_id
       JOIN master_departments d ON d.id = a.department_id
       WHERE ${where} AND a.status = 'info_requested'
       ORDER BY a.updated_at DESC LIMIT 20`,
      p,
    ),
    // DPRs she started or filled but has not sent.
    query<Row>(
      `SELECT h.hh_code, h.didi_name, h.didi_name_en, s.code AS scheme, s.name_hi AS scheme_hi,
              s.name_en AS scheme_en, r.status, r.current_step, COUNT(*) OVER () AS total
       FROM tbl_dpr_drafts r
       JOIN tbl_households h ON h.id = r.household_id ${PLACE}
       JOIN master_schemes s ON s.id = r.scheme_id
       WHERE ${where} AND r.status IN ('draft', 'filled')
       ORDER BY r.updated_at DESC LIMIT ${LIST}`,
      p,
    ),
  ])
  const didi = (r: Row) => ({ code: r.hh_code as string, name: localized(r, "didi_name") })
  return {
    toSurvey: Number(counts?.to_survey ?? 0),
    surveyedToday: Number(counts?.surveyed_today ?? 0),
    surveyedThisWeek: Number(counts?.surveyed_week ?? 0),
    incomeDue: {
      total: Number(incomeDue[0]?.total ?? 0),
      items: incomeDue.map((r) => ({ ...didi(r), village: localized(r, "village") })),
    },
    infoRequested: infoRequested.map((r) => ({
      ...didi(r),
      application: r.app_code as string,
      scheme: r.scheme as string,
      schemeName: localizedName(r, "scheme"),
      department: localizedName(r, "dept"),
      comment: (r.last_comment as string | null) ?? null,
    })),
    dprs: {
      total: Number(dprs[0]?.total ?? 0),
      items: dprs.map((r) => ({
        ...didi(r),
        scheme: r.scheme as string,
        schemeName: localizedName(r, "scheme"),
        ready: r.status === "filled",
        step: Number(r.current_step),
      })),
    },
  }
}
