// Background worker (runs inside the API process):
//   - sends queued pushes, retrying with back-off, dropping dead devices
//   - raises "overdue" notices for applications past their SLA (hourly)
//   - prunes old notices and delivery rows (daily)
import crypto from "node:crypto"

import { exec, query, transaction } from "../../db/pool.ts"
import { sha256 } from "../../shared/format.ts"
import { withLang } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { OPEN_STATUSES } from "../applications/applications.labels.ts"
import { notifyApplication } from "./notifications.applications.ts"
import {
  actionsFor,
  isGoneStatus,
  nextRetryMinutes,
  type NotificationType,
  type Payload,
  renderNotice,
  urgencyFor,
} from "./notifications.model.ts"
import { notificationEvents } from "./notifications.service.ts"
import { sendPush } from "./push.ts"

const BATCH = 100
const LEASE_MINUTES = 2
const POLL_MS = 15_000
const HOUR = 3_600_000

/** Leases due deliveries to this worker. Atomic UPDATE, so two API processes never send the same row. */
async function claimDue() {
  const token = crypto.randomBytes(16).toString("hex")
  const claimed = await exec(
    `UPDATE tbl_notification_deliveries
     SET claim_token = ?, next_attempt_at = NOW() + INTERVAL ${LEASE_MINUTES} MINUTE
     WHERE status = 'pending' AND next_attempt_at <= NOW()
     ORDER BY next_attempt_at LIMIT ${BATCH}`,
    [token],
  )
  if (!claimed.affectedRows) return []
  return query<Row>(
    `SELECT d.id, d.attempts, s.id AS subscription_id, s.endpoint, s.p256dh, s.auth, s.lang,
            r.id AS recipient_id, r.link, r.read_at, n.id AS notification_id, n.payload,
            n.entity_type, n.entity_ref, t.priority, t.ttl_hours,
            t.title_hi, t.title_en, t.body_hi, t.body_en, t.actions
     FROM tbl_notification_deliveries d
     JOIN tbl_push_subscriptions s       ON s.id = d.subscription_id
     JOIN tbl_notification_recipients r  ON r.id = d.recipient_id
     JOIN tbl_notifications n            ON n.id = r.notification_id
     JOIN master_notification_types t    ON t.id = n.type_id
     WHERE d.claim_token = ?`,
    [token],
  )
}

const finish = (id: number, status: string, error: string | null = null) =>
  exec(
    `UPDATE tbl_notification_deliveries
     SET status = ?, attempts = attempts + 1, last_error = ?, claim_token = NULL,
         sent_at = IF(? = 'sent', NOW(), sent_at)
     WHERE id = ?`,
    [status, error, status, id],
  )

async function deliver(row: Row) {
  // Already read in the app: a phone alert now would only be noise.
  if (row.read_at) return finish(row.id, "skipped")
  const payload: Payload = JSON.parse(row.payload || "{}")
  const { title, body } = renderNotice(row as unknown as NotificationType, payload, row.lang)
  // Answer buttons on the phone: the service worker has no session, so each push
  // carries its own random single-use token (only the hash is stored).
  const actions = actionsFor(row.actions, row.lang)
  let token: string | undefined
  if (actions.length) {
    token = crypto.randomBytes(24).toString("base64url")
    await exec("UPDATE tbl_notification_deliveries SET action_token_hash = ? WHERE id = ?", [
      sha256(token),
      row.id,
    ])
  }
  try {
    await sendPush(
      { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
      {
        title,
        body,
        url: row.link ?? "/",
        // A newer notice about the same application replaces the older one on the phone.
        tag: row.entity_ref ? `${row.entity_type}:${row.entity_ref}` : `n:${row.notification_id}`,
        id: Number(row.recipient_id),
        ...(token
          ? { token, actions: actions.map((a) => ({ action: a.id, title: a.label })) }
          : {}),
      },
      { ttlSeconds: Number(row.ttl_hours) * 3600, urgency: urgencyFor(row.priority) },
    )
    await finish(row.id, "sent")
    await exec(
      "UPDATE tbl_push_subscriptions SET failure_count = 0, last_success_at = NOW() WHERE id = ?",
      [row.subscription_id],
    )
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = String((error as Error).message ?? error).slice(0, 255)
    if (isGoneStatus(status)) {
      // The phone unsubscribed or uninstalled: stop using this device everywhere.
      await exec("UPDATE tbl_push_subscriptions SET revoked_at = NOW() WHERE id = ?", [
        row.subscription_id,
      ])
      await exec(
        `UPDATE tbl_notification_deliveries SET status = 'gone', claim_token = NULL
         WHERE subscription_id = ? AND status = 'pending'`,
        [row.subscription_id],
      )
      return finish(row.id, "gone", message)
    }
    const wait = nextRetryMinutes(Number(row.attempts) + 1)
    if (wait === null) {
      await exec(
        "UPDATE tbl_push_subscriptions SET failure_count = LEAST(failure_count + 1, 255) WHERE id = ?",
        [row.subscription_id],
      )
      return finish(row.id, "failed", message)
    }
    await exec(
      `UPDATE tbl_notification_deliveries
       SET attempts = attempts + 1, last_error = ?, claim_token = NULL,
           next_attempt_at = NOW() + INTERVAL ? MINUTE
       WHERE id = ?`,
      [message, wait, row.id],
    )
  }
}

async function sendDue() {
  for (;;) {
    const rows = await claimDue()
    if (!rows.length) return
    // Small parallel groups: fast, without opening hundreds of sockets at once.
    for (let i = 0; i < rows.length; i += 10)
      await Promise.allSettled(rows.slice(i, i + 10).map(deliver))
    if (rows.length < BATCH) return
  }
}

/** One "overdue" notice per application per SLA date (the dedupe key makes reruns harmless). */
async function sweepOverdue() {
  const overdue = await query<Row>(
    `SELECT id, sla_due_on FROM tbl_applications
     WHERE status IN (?) AND sla_due_on < CURDATE()`,
    [OPEN_STATUSES],
  )
  for (const app of overdue) {
    const due = String(app.sla_due_on).slice(0, 10)
    await transaction((db) =>
      notifyApplication(
        app.id,
        "overdue",
        { dedupeKey: `application:${app.id}:overdue:${due}` },
        db,
      ),
    )
  }
}

async function prune() {
  await exec("DELETE FROM tbl_notifications WHERE created_at < NOW() - INTERVAL 180 DAY")
  await exec(
    `DELETE FROM tbl_notification_deliveries
     WHERE status <> 'pending' AND created_at < NOW() - INTERVAL 30 DAY`,
  )
}

/** Starts the worker; returns a stop function. */
export function startNotificationWorker() {
  let busy = false
  let lastSweep = 0
  let lastPrune = 0
  const tick = async () => {
    if (busy) return
    busy = true
    try {
      await withLang("hi", async () => {
        await sendDue()
        if (Date.now() - lastSweep > HOUR) {
          lastSweep = Date.now()
          await sweepOverdue()
          await sendDue()
        }
        if (Date.now() - lastPrune > 24 * HOUR) {
          lastPrune = Date.now()
          await prune()
        }
      })
    } catch (error) {
      console.error("notification worker:", error)
    } finally {
      busy = false
    }
  }
  const timer = setInterval(tick, POLL_MS)
  // New pushes go out within about a second (after the producer's transaction commits).
  let soon: NodeJS.Timeout | undefined
  const onQueued = () => {
    clearTimeout(soon)
    soon = setTimeout(tick, 1000)
  }
  notificationEvents.on("queued", onQueued)
  void tick()
  return () => {
    clearInterval(timer)
    clearTimeout(soon)
    notificationEvents.off("queued", onQueued)
  }
}
