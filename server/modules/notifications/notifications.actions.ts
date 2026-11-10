// Answers to actionable notices ("Yes, I want to apply" / "Not now").
// Two ways in, one path: the signed-in app (recipient id + session) or a phone
// notification button (single-use token carried in the push).
import { type Db, exec, one, transaction } from "../../db/pool.ts"
import { badRequest, notFound } from "../../shared/errors.ts"
import { sha256 } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { type InterestAnswer, onSchemeAnswer } from "../recommendations/interest.ts"
import { actionsFor } from "./notifications.model.ts"

type Via = "app" | "push"
type Handler = (notificationId: number, answer: string, via: Via, db: Db) => Promise<void>

/** What happens when someone answers a notice of each type. */
const handlers: Record<string, Handler> = {
  "scheme.suggested": (id, answer, via, db) =>
    onSchemeAnswer(id, answer as InterestAnswer, via, db),
}

/** Push tokens stop working after this long, whether used or not. */
const TOKEN_DAYS = 14

async function answer(recipientId: number, answerId: string, via: Via, db: Db) {
  const row = await one<Row>(
    `SELECT r.id, r.notification_id, r.response, t.code, t.actions
     FROM tbl_notification_recipients r
     JOIN tbl_notifications n         ON n.id = r.notification_id
     JOIN master_notification_types t ON t.id = n.type_id
     WHERE r.id = ? FOR UPDATE`,
    [recipientId],
    db,
  )
  if (!row) throw notFound(msg("सूचना नहीं मिली"))
  if (!actionsFor(row.actions, "hi").some((a) => a.id === answerId))
    throw badRequest(msg("अमान्य उत्तर"))
  // First answer wins; repeating it (double tap, phone + app) is harmless.
  if (row.response) return row.response as string
  await exec(
    `UPDATE tbl_notification_recipients
     SET response = ?, responded_at = NOW(), read_at = COALESCE(read_at, NOW())
     WHERE id = ?`,
    [answerId, recipientId],
    db,
  )
  await handlers[row.code]?.(Number(row.notification_id), answerId, via, db)
  return answerId
}

/** In-app answer: the notice must belong to the signed-in user. */
export function respondAsUser(userId: number, recipientId: number, answerId: string) {
  return transaction(async (db) => {
    const owned = await one<Row>(
      "SELECT id FROM tbl_notification_recipients WHERE id = ? AND user_id = ?",
      [recipientId, userId],
      db,
    )
    if (!owned) throw notFound(msg("सूचना नहीं मिली"))
    return answer(recipientId, answerId, "app", db)
  })
}

/** Answer from a phone notification button. The token is the only credential. */
export function respondWithToken(token: string, answerId: string) {
  return transaction(async (db) => {
    const delivery = await one<Row>(
      `SELECT recipient_id FROM tbl_notification_deliveries
       WHERE action_token_hash = ? AND created_at > NOW() - INTERVAL ${TOKEN_DAYS} DAY`,
      [sha256(token)],
      db,
    )
    if (!delivery) throw notFound(msg("यह लिंक अब मान्य नहीं है"))
    // Single use: the token can't answer again (or be replayed from a leaked push).
    await exec(
      "UPDATE tbl_notification_deliveries SET action_token_hash = NULL WHERE action_token_hash = ?",
      [sha256(token)],
      db,
    )
    return answer(Number(delivery.recipient_id), answerId, "push", db)
  })
}
