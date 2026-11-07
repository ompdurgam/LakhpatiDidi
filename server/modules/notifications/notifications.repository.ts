// SQL for a user's inbox and devices. Every query is scoped by the session user's id.
import { exec, one, query } from "../../db/pool.ts"
import { sha256 } from "../../shared/format.ts"
import type { Row } from "../../shared/types.ts"

/**
 * One page of the inbox, newest first. Keyset pagination (`id < before`) stays fast
 * however deep the user scrolls, unlike OFFSET. Uses ix_recipient_inbox.
 */
export function listInbox(
  userId: number,
  options: { before?: number; limit: number; unreadOnly: boolean },
) {
  return query<Row>(
    `SELECT r.id, r.link, r.read_at, r.response, r.created_at, n.payload, n.entity_type, n.entity_ref,
            t.code, t.category, t.priority, t.title_hi, t.title_en, t.body_hi, t.body_en, t.actions
     FROM tbl_notification_recipients r
     JOIN tbl_notifications n         ON n.id = r.notification_id
     JOIN master_notification_types t ON t.id = n.type_id
     WHERE r.user_id = ? AND r.archived_at IS NULL
       ${options.before ? "AND r.id < ?" : ""}
       ${options.unreadOnly ? "AND r.read_at IS NULL" : ""}
     ORDER BY r.id DESC
     LIMIT ?`,
    [userId, ...(options.before ? [options.before] : []), options.limit],
  )
}

/** Badge count. Uses ix_recipient_unread (covering), so it is an index-only count. */
export async function unreadCount(userId: number) {
  const row = await one<Row>(
    `SELECT COUNT(*) AS n FROM tbl_notification_recipients
     WHERE user_id = ? AND archived_at IS NULL AND read_at IS NULL`,
    [userId],
  )
  return Number(row?.n ?? 0)
}

export async function markRead(userId: number, ids: number[] | "all") {
  if (ids !== "all" && !ids.length) return 0
  const result = await exec(
    `UPDATE tbl_notification_recipients SET read_at = NOW()
     WHERE user_id = ? AND read_at IS NULL ${ids === "all" ? "" : "AND id IN (?)"}`,
    ids === "all" ? [userId] : [userId, ids],
  )
  return result.affectedRows
}

export async function archive(userId: number, id: number) {
  const result = await exec(
    `UPDATE tbl_notification_recipients SET archived_at = NOW(), read_at = COALESCE(read_at, NOW())
     WHERE user_id = ? AND id = ?`,
    [userId, id],
  )
  return result.affectedRows
}

export type SubscriptionInput = {
  endpoint: string
  p256dh: string
  auth: string
  lang: "hi" | "en"
  userAgent: string | null
}

/**
 * Saves this device for the user. A shared phone that changes hands moves to the
 * new user (the endpoint is unique), and a re-subscribe revives a revoked row.
 */
export function upsertSubscription(userId: number, s: SubscriptionInput) {
  return exec(
    `INSERT INTO tbl_push_subscriptions (user_id, endpoint, endpoint_hash, p256dh, auth, lang, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth),
       lang = VALUES(lang), user_agent = VALUES(user_agent), revoked_at = NULL, failure_count = 0`,
    [userId, s.endpoint, sha256(s.endpoint), s.p256dh, s.auth, s.lang, s.userAgent],
  )
}

/** Logout / "turn off alerts" on this device. */
export function revokeSubscription(userId: number, endpoint: string) {
  return exec(
    `UPDATE tbl_push_subscriptions SET revoked_at = NOW()
     WHERE user_id = ? AND endpoint_hash = ? AND revoked_at IS NULL`,
    [userId, sha256(endpoint)],
  )
}
