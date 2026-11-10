// A Didi's interest in a recommended scheme: her answer to the phone question
// ("scheme.suggested") or one she gives herself on her "My schemes" page.
// Either way tbl_scheme_interests records it and her CRP (and block, on a "yes") is told.
import { type Db, exec, one, query, transaction } from "../../db/pool.ts"
import { badRequest } from "../../shared/errors.ts"
import { inr } from "../../shared/format.ts"
import { msg, withLang } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { respondAsUser } from "../notifications/notifications.actions.ts"
import { notify, type Recipient } from "../notifications/notifications.service.ts"
import { loadHousehold } from "./household.ts"
import { recommendationsFor } from "./recommendations.service.ts"
import { loadSchemes } from "./schemes.ts"

export type InterestAnswer = "yes" | "no"
type Via = "app" | "push"

const INTEREST_SQL = `SELECT i.id, i.status, i.expected_gain, i.notification_id,
            h.hh_code, h.didi_name, h.didi_name_en, h.village_id, gp.block_id,
            s.code AS scheme_code, s.name_hi, s.name_en
     FROM tbl_scheme_interests i
     JOIN tbl_households h          ON h.id = i.household_id
     JOIN master_villages v         ON v.id = h.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_schemes s          ON s.id = i.scheme_id`

/** Stores the answer and tells the field team (CRP of her village; block too on a "yes"). */
async function recordAnswer(row: Row, answer: InterestAnswer, via: Via, db: Db) {
  await exec(
    `UPDATE tbl_scheme_interests SET status = ?, responded_via = ?, responded_at = NOW()
     WHERE id = ?`,
    [answer === "yes" ? "interested" : "not_interested", via, row.id],
    db,
  )
  const staff = await query<Row>(
    `SELECT id, role FROM master_users WHERE status = 'active'
       AND ((role = 'field' AND village_id = ?) OR (? AND role = 'block' AND block_id = ?))`,
    [row.village_id, answer === "yes", row.block_id],
    db,
  )
  const recipients: Recipient[] = staff.map((u) => ({
    userId: Number(u.id),
    link: u.role === "field" ? `/field/dpr/${row.hh_code}/${row.scheme_code}` : "/block/households",
  }))
  await notify(
    {
      type: answer === "yes" ? "scheme.interested" : "scheme.declined",
      payload: {
        didi: row.didi_name,
        didi_en: row.didi_name_en || null,
        scheme: row.name_hi,
        scheme_en: row.name_en || null,
        gain: inr(Number(row.expected_gain ?? 0)),
      },
      entity: { type: "household", ref: row.hh_code },
      dedupeKey: `scheme_interest:${row.id}:${answer}`,
      recipients,
    },
    db,
  )
}

/** Her answer to a "scheme.suggested" notice (bell menu or phone button). */
export async function onSchemeAnswer(
  notificationId: number,
  answer: InterestAnswer,
  via: Via,
  db: Db,
) {
  const row = await one<Row>(
    `${INTEREST_SQL} WHERE i.notification_id = ? FOR UPDATE`,
    [notificationId],
    db,
  )
  if (!row || row.status !== "asked") return
  await recordAnswer(row, answer, via, db)
}

/**
 * Her answer from the "My schemes" page. Only schemes recommended to her count.
 * An open phone question is answered through the notice, so the bell shows it answered.
 * "Not now" can later become "yes"; a "yes" stays (the CRP is already preparing the DPR).
 */
export async function answerFromProfile(
  hhCode: string,
  userId: number,
  schemeCode: string,
  answer: InterestAnswer,
) {
  const h = await withLang("hi", () => loadHousehold(hhCode))
  if (!h) throw badRequest(msg("परिवार नहीं मिला"))
  const [schemes, applied] = await Promise.all([
    withLang("hi", loadSchemes),
    query<Row>(
      `SELECT s.code FROM tbl_applications a JOIN master_schemes s ON s.id = a.scheme_id
       WHERE a.household_id = ?`,
      [h.id],
    ),
  ])
  const fit = recommendationsFor(h, schemes, new Set(applied.map((r) => r.code as string))).find(
    (r) => r.code === schemeCode,
  )
  if (!fit) throw badRequest(msg("यह योजना आपके लिए सुझाई नहीं गई है"))

  const asked = await one<Row>(
    `SELECT r.id FROM tbl_scheme_interests i
     JOIN master_schemes s ON s.id = i.scheme_id
     JOIN tbl_notification_recipients r ON r.notification_id = i.notification_id AND r.user_id = ?
     WHERE i.household_id = ? AND s.code = ? AND i.status = 'asked'`,
    [userId, h.id, schemeCode],
  )
  if (asked) {
    await respondAsUser(userId, Number(asked.id), answer)
    return
  }

  await transaction(async (db) => {
    // Insert as "asked" (no question sent), then record the answer like any other.
    await exec(
      `INSERT INTO tbl_scheme_interests (household_id, scheme_id, status, match_score, expected_gain)
       SELECT ?, s.id, 'asked', ?, ? FROM master_schemes s WHERE s.code = ?
       ON DUPLICATE KEY UPDATE tbl_scheme_interests.id = tbl_scheme_interests.id`,
      [h.id, fit.score, fit.gain, schemeCode],
      db,
    )
    const row = await one<Row>(
      `${INTEREST_SQL} WHERE i.household_id = ? AND s.code = ? FOR UPDATE`,
      [h.id, schemeCode],
      db,
    )
    if (!row || row.status === "interested") return
    if (row.status === "not_interested" && answer === "no") return
    await recordAnswer(row, answer, "app", db)
  })
}
