// Write side of notifications. `notify` is called by producers INSIDE their own
// transaction, so the notice, every recipient's inbox row and the push queue are
// committed together with the business change (transactional outbox).
import { EventEmitter } from "node:events"

import { type Db, exec, one, pool } from "../../db/pool.ts"
import type { Row } from "../../shared/types.ts"
import type { Payload } from "./notifications.model.ts"

export type Recipient = { userId: number; link: string | null }

export type NoticeInput = {
  /** master_notification_types.code, e.g. "application.sanctioned" */
  type: string
  payload: Payload
  entity?: { type: string; ref: string }
  actorId?: number | null
  /** Same key → never notified twice (safe to re-run sweeps and retries). */
  dedupeKey?: string
  recipients: Recipient[]
}

/** Fires "queued" when new push deliveries exist, so the worker sends without waiting a poll. */
export const notificationEvents = new EventEmitter()

/** Fans one event out to its recipients. Returns the notification id, or null if nothing was written. */
export async function notify(input: NoticeInput, db: Db = pool): Promise<number | null> {
  // One row per person; the person who did the action isn't told about it.
  const byUser = new Map<number, Recipient>()
  for (const r of input.recipients) if (r.userId !== input.actorId) byUser.set(r.userId, r)
  if (!byUser.size) return null

  const type = await one<Row>(
    "SELECT id, push_enabled FROM master_notification_types WHERE code = ? AND is_active = 1",
    [input.type],
    db,
  )
  if (!type) {
    console.warn(`notify: unknown or inactive notification type "${input.type}"`)
    return null
  }

  // ON DUPLICATE KEY … id = id is a no-op that reports 0 affected rows for a repeated dedupe key.
  const created = await exec(
    `INSERT INTO tbl_notifications (type_id, payload, entity_type, entity_ref, actor_user_id, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [
      type.id,
      JSON.stringify(input.payload),
      input.entity?.type ?? null,
      input.entity?.ref ?? null,
      input.actorId ?? null,
      input.dedupeKey ?? null,
    ],
    db,
  )
  if (created.affectedRows !== 1) return null
  const notificationId = created.insertId

  await exec(
    "INSERT INTO tbl_notification_recipients (notification_id, user_id, link) VALUES ?",
    [[...byUser.values()].map((r) => [notificationId, r.userId, r.link])],
    db,
  )

  if (type.push_enabled) {
    const queued = await exec(
      `INSERT INTO tbl_notification_deliveries (recipient_id, subscription_id)
       SELECT r.id, s.id
       FROM tbl_notification_recipients r
       JOIN tbl_push_subscriptions s ON s.user_id = r.user_id AND s.revoked_at IS NULL
       WHERE r.notification_id = ?`,
      [notificationId],
      db,
    )
    if (queued.affectedRows) notificationEvents.emit("queued")
  }
  return notificationId
}
