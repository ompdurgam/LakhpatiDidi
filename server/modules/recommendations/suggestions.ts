// Asks a Didi on her phone whether she wants to apply for the scheme that fits her
// best, and tells her CRP (and block, on a "yes") what she answered.
import { type Db, exec, one, query, transaction } from "../../db/pool.ts"
import { inr } from "../../shared/format.ts"
import { withLang } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { notify, type Recipient } from "../notifications/notifications.service.ts"
import { loadHousehold } from "./household.ts"
import { recommendationsFor } from "./recommendations.service.ts"
import { loadSchemes } from "./schemes.ts"

export type InterestAnswer = "yes" | "no"

/** Scheme codes this household already applied for or was already asked about. */
async function settledSchemes(householdId: number) {
  const rows = await query<Row>(
    `SELECT s.code FROM tbl_applications a JOIN master_schemes s ON s.id = a.scheme_id
     WHERE a.household_id = ?
     UNION
     SELECT s.code FROM tbl_scheme_interests i JOIN master_schemes s ON s.id = i.scheme_id
     WHERE i.household_id = ?`,
    [householdId, householdId],
  )
  return new Set(rows.map((r) => r.code as string))
}

/**
 * Sends the "would you like to apply?" question for her best-fit scheme (or `schemeCode`).
 * Skips quietly when she has no login, nothing new fits, or she was asked before.
 * Returns the scheme code asked about, or null.
 */
export async function askAboutBestScheme(
  hhCode: string,
  options: { askedBy?: number | null; schemeCode?: string } = {},
): Promise<string | null> {
  // Hindi names into the payload; English comes from the *_en fields below.
  const h = await withLang("hi", () => loadHousehold(hhCode))
  if (!h?.mobile) return null
  const didi = await one<Row>(
    "SELECT id FROM master_users WHERE role = 'didi' AND mobile = ? AND status = 'active'",
    [h.mobile],
  )
  if (!didi) return null

  // One open question at a time: don't stack a second scheme on an unanswered one.
  if (!options.schemeCode) {
    const open = await one<Row>(
      "SELECT id FROM tbl_scheme_interests WHERE household_id = ? AND status = 'asked' LIMIT 1",
      [h.id],
    )
    if (open) return null
  }

  const [schemes, settled] = await Promise.all([withLang("hi", loadSchemes), settledSchemes(h.id)])
  const recs = recommendationsFor(h, schemes, settled)
  const pick = options.schemeCode ? recs.find((r) => r.code === options.schemeCode) : recs[0]
  if (!pick) return null

  const names = await one<Row>(
    `SELECT s.id, s.name_hi, s.name_en, h.didi_name_en
     FROM master_schemes s, tbl_households h WHERE s.code = ? AND h.id = ?`,
    [pick.code, h.id],
  )
  if (!names) return null

  return transaction(async (db) => {
    const interest = await exec(
      `INSERT INTO tbl_scheme_interests (household_id, scheme_id, match_score, expected_gain, asked_by)
       VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id`,
      [h.id, names.id, pick.score, pick.gain, options.askedBy ?? null],
      db,
    )
    if (interest.affectedRows !== 1) return null // asked before (race-safe via the unique key)
    const notificationId = await notify(
      {
        type: "scheme.suggested",
        payload: {
          didi: h.name,
          didi_en: names.didi_name_en || null,
          scheme: names.name_hi,
          scheme_en: names.name_en || null,
          gain: inr(pick.gain),
          score: pick.score,
        },
        entity: { type: "scheme_interest", ref: String(interest.insertId) },
        actorId: options.askedBy ?? null,
        dedupeKey: `scheme_interest:${interest.insertId}`,
        recipients: [{ userId: Number(didi.id), link: "/didi" }],
      },
      db,
    )
    await exec(
      "UPDATE tbl_scheme_interests SET notification_id = ? WHERE id = ?",
      [notificationId, interest.insertId],
      db,
    )
    return pick.code
  })
}

/** Records her answer to a "scheme.suggested" notice and tells the field team. */
export async function onSchemeAnswer(
  notificationId: number,
  answer: InterestAnswer,
  via: "app" | "push",
  db: Db,
) {
  const row = await one<Row>(
    `SELECT i.id, i.status, i.expected_gain, h.hh_code, h.didi_name, h.didi_name_en, h.village_id,
            gp.block_id, s.code AS scheme_code, s.name_hi, s.name_en
     FROM tbl_scheme_interests i
     JOIN tbl_households h          ON h.id = i.household_id
     JOIN master_villages v         ON v.id = h.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_schemes s          ON s.id = i.scheme_id
     WHERE i.notification_id = ? FOR UPDATE`,
    [notificationId],
    db,
  )
  if (!row || row.status !== "asked") return
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
