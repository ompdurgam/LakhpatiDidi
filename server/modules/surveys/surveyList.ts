// The surveyor's work list: Didis already on record (e.g. from the state PLD
// list) in her area, and the details that prefill a survey for one of them.
import { one, query } from "../../db/pool.ts"
import type { Row, SessionUser } from "../../shared/types.ts"
import { sessionCondition } from "../auth/assignments.ts"

export const PAGE_SIZE = 20

const PLACE_JOINS = `
  JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id
  JOIN master_districts d        ON d.id  = b.district_id
  LEFT JOIN master_shgs s        ON s.id  = h.shg_id`

/** The session's areas as a condition over v / gp / b ("TRUE" when statewide). */
export async function areaOf(user: SessionUser) {
  return (await sessionCondition(user)) ?? { sql: "TRUE", params: [] as unknown[] }
}

export type SurveyStatus = "pending" | "done" | "all"

export async function listForSurvey(
  user: SessionUser,
  opts: { q: string; status: SurveyStatus; page: number },
) {
  const area = await areaOf(user)
  const [counts] = await query<Row>(
    `SELECT COUNT(*) AS total, COALESCE(SUM(h.surveyed_at IS NULL), 0) AS pending
     FROM tbl_households h ${PLACE_JOINS} WHERE ${area.sql}`,
    area.params,
  )

  const where = [area.sql]
  const params = [...area.params]
  if (opts.status === "pending") where.push("h.surveyed_at IS NULL")
  if (opts.status === "done") where.push("h.surveyed_at IS NOT NULL")
  if (opts.q) {
    const like = `%${opts.q}%`
    where.push(
      "(h.didi_name LIKE ? OR h.didi_name_en LIKE ? OR h.hh_code LIKE ? OR h.lokos_member_code LIKE ? OR v.name_hi LIKE ? OR v.name_en LIKE ?)",
    )
    params.push(like, like, like, like, like, like)
  }
  const rows = await query<Row>(
    `SELECT h.hh_code, h.didi_name, h.guardian_name, h.is_pld, h.surveyed_at,
            h.current_annual_income, v.name_hi AS village, s.name AS shg
     FROM tbl_households h ${PLACE_JOINS}
     WHERE ${where.join(" AND ")}
     ORDER BY h.id LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE + 1, opts.page * PAGE_SIZE],
  )
  const total = Number(counts.total)
  const pending = Number(counts.pending)
  return {
    total,
    pending,
    done: total - pending,
    hasMore: rows.length > PAGE_SIZE,
    items: rows.slice(0, PAGE_SIZE).map((r) => ({
      code: r.hh_code as string,
      name: r.didi_name as string,
      guardian: (r.guardian_name as string | null) ?? null,
      village: r.village as string,
      shg: (r.shg as string | null) ?? null,
      pld: Boolean(r.is_pld),
      surveyed: r.surveyed_at !== null,
      income: Number(r.current_annual_income),
    })),
  }
}

/** One Didi's record, to prefill her survey. Undefined outside the user's area. */
export async function householdForSurvey(user: SessionUser, code: string) {
  const area = await areaOf(user)
  const r = await one<Row>(
    `SELECT h.hh_code, h.lokos_member_code, h.didi_name, h.guardian_name, h.age, h.mobile,
            h.social_category, h.surveyed_at, d.name_hi AS district, b.name_hi AS block,
            gp.name_hi AS panchayat, v.name_hi AS village, s.name AS shg
     FROM tbl_households h ${PLACE_JOINS}
     WHERE h.hh_code = ? AND ${area.sql}`,
    [code, ...area.params],
  )
  if (!r) return undefined
  return {
    code: r.hh_code as string,
    memberCode: (r.lokos_member_code as string | null) ?? null,
    name: r.didi_name as string,
    guardian: (r.guardian_name as string | null) ?? null,
    age: (r.age as number | null) ?? null,
    mobile: (r.mobile as string | null) ?? null,
    category: r.social_category as string,
    surveyed: r.surveyed_at !== null,
    district: r.district as string,
    block: r.block as string,
    panchayat: r.panchayat as string,
    village: r.village as string,
    shg: (r.shg as string | null) ?? null,
  }
}
