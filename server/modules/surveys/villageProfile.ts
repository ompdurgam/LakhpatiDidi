// Village profiles (D3–D5 and resources), one per village, filled by a CRP
// for villages in her own area.
import { z } from "zod"

import { exec, one, query } from "../../db/pool.ts"
import { notFound } from "../../shared/errors.ts"
import { formatDate } from "../../shared/format.ts"
import { localizedName, msg } from "../../shared/i18n.ts"
import type { Row, SessionUser } from "../../shared/types.ts"
import { parse } from "../../shared/validation.ts"
import { areaOf } from "./surveyList.ts"

// The session's areas, over the v / gp / b aliases of PLACE.
const villageArea = (user: SessionUser) => areaOf(user)

const PLACE = `master_villages v
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id`

/** Villages in the user's area, matching `q`, with whether a profile is saved. */
export async function listVillages(user: SessionUser, q: string) {
  const area = await villageArea(user)
  const like = `%${q}%`
  const rows = await query<Row>(
    `SELECT v.lgd_code, v.name_hi, v.name_en, gp.name_hi AS gp_hi, gp.name_en AS gp_en,
            (SELECT updated_at FROM tbl_village_profiles p WHERE p.village_id = v.id) AS saved_at
     FROM ${PLACE}
     WHERE ${area.sql} AND v.lgd_code IS NOT NULL
       AND (? = '' OR v.name_hi LIKE ? OR v.name_en LIKE ? OR v.lgd_code LIKE ?)
     ORDER BY saved_at IS NULL, v.name_en LIMIT ?`,
    // A search shows the best 30; with no search, every village (a block has a few hundred).
    [...area.params, q, like, like, like, q ? 30 : 2000],
  )
  return rows.map((r) => ({
    code: r.lgd_code as string,
    name: localizedName(r),
    panchayat: localizedName(r, "gp"),
    savedAt: r.saved_at ? formatDate(r.saved_at, true) : null,
  }))
}

async function findVillage(user: SessionUser, code: string) {
  const area = await villageArea(user)
  const v = await one<Row>(
    `SELECT v.id, v.lgd_code, v.name_hi, v.name_en, gp.name_hi AS gp_hi, gp.name_en AS gp_en,
            b.name_hi AS block_hi, b.name_en AS block_en
     FROM ${PLACE} WHERE v.lgd_code = ? AND ${area.sql}`,
    [code, ...area.params],
  )
  if (!v) throw notFound(msg("गाँव नहीं मिला"))
  return v
}

export async function getVillageProfile(user: SessionUser, code: string) {
  const v = await findVillage(user, code)
  const saved = await one<Row>(
    `SELECT p.responses, p.updated_at, u.name AS updated_by
     FROM tbl_village_profiles p LEFT JOIN master_users u ON u.id = p.updated_by
     WHERE p.village_id = ?`,
    [v.id],
  )
  return {
    code: v.lgd_code as string,
    name: localizedName(v),
    panchayat: localizedName(v, "gp"),
    block: localizedName(v, "block"),
    responses: saved ? JSON.parse(saved.responses) : {},
    savedAt: saved ? formatDate(saved.updated_at, true) : null,
    savedBy: (saved?.updated_by as string | undefined) ?? null,
  }
}

const answer = z.record(z.string().max(120), z.union([z.string().max(120), z.number()]))
const responsesBody = z.object({
  facilities: z.record(z.string().max(120), answer).default({}),
  institutions: z.record(z.string().max(120), answer).default({}),
  needs: z.array(z.string().max(120)).max(3).default([]),
  resources: answer.default({}),
})

export async function saveVillageProfile(user: SessionUser, code: string, body: unknown) {
  const v = await findVillage(user, code)
  const responses = parse(responsesBody, body)
  await exec(
    `INSERT INTO tbl_village_profiles (village_id, responses, updated_by) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE responses = VALUES(responses), updated_by = VALUES(updated_by)`,
    [v.id, JSON.stringify(responses), user.id],
  )
}
