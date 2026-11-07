// Custom notices sent down the hierarchy. Recipients are selected and fanned out in SQL
// (INSERT … SELECT), so a statewide notice to every Didi stays a handful of statements.
import { exec, one, query, transaction } from "../../db/pool.ts"
import { badRequest, HttpError } from "../../shared/errors.ts"
import { formatDate } from "../../shared/format.ts"
import { localizedName, msg } from "../../shared/i18n.ts"
import type { Role, Row } from "../../shared/types.ts"
import {
  allowedRoles,
  areaLevelFor,
  HOURLY_LIMIT,
  type Scope,
  ScopeError,
  scopeFor,
  SENDABLE_ROLES,
  type Sender,
} from "./broadcasts.rules.ts"
import { notificationEvents } from "./notifications.service.ts"

const TYPE_CODE = "broadcast.message"

export async function loadSender(userId: number) {
  const row = await one<Row>(
    `SELECT id, name, role, designation, district_id, block_id, village_id
     FROM master_users WHERE id = ?`,
    [userId],
  )
  if (!row) throw new HttpError(403, msg("यह सुविधा आपकी भूमिका के लिए उपलब्ध नहीं है"))
  const sender: Sender = {
    id: row.id,
    role: row.role as Role,
    districtId: row.district_id,
    blockId: row.block_id,
    villageId: row.village_id,
  }
  return { sender, name: String(row.name), designation: String(row.designation) }
}

/** Turns a rule violation into the API's error with a message in the request language. */
export function scopeErrorToHttp(error: unknown): never {
  if (!(error instanceof ScopeError)) throw error
  if (error.reason === "no_area")
    throw badRequest(msg("आपका कार्यक्षेत्र सेट नहीं है। एडमिन से संपर्क करें।"))
  if (error.reason === "bad_roles") throw badRequest(msg("किसे भेजना है, यह चुनें"))
  throw new HttpError(403, msg("यह सुविधा आपकी भूमिका के लिए उपलब्ध नहीं है"))
}

/**
 * FROM/WHERE selecting the active users in `roles` inside `scope`. A user's location comes
 * from their own columns, else from their village (Didis and CRPs only store a village).
 */
function audienceFrom(scope: Scope, roles: Role[], senderId: number) {
  const where = ["u.status = 'active'", "u.role IN (?)", "u.id <> ?"]
  const params: unknown[] = [roles, senderId]
  if (scope.districtId) {
    where.push("COALESCE(u.district_id, b.district_id) = ?")
    params.push(scope.districtId)
  }
  if (scope.blockId) {
    where.push("COALESCE(u.block_id, gp.block_id) = ?")
    params.push(scope.blockId)
  }
  if (scope.villageId) {
    where.push("u.village_id = ?")
    params.push(scope.villageId)
  }
  const sql = `FROM master_users u
     LEFT JOIN master_villages v         ON v.id = u.village_id
     LEFT JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     LEFT JOIN master_blocks b           ON b.id = COALESCE(u.block_id, gp.block_id)
     WHERE ${where.join(" AND ")}`
  return { sql, params }
}

function resolve(sender: Sender, roles: readonly string[], areaId?: number | null) {
  try {
    return { roles: allowedRoles(sender.role, roles), scope: scopeFor(sender, areaId) }
  } catch (error) {
    return scopeErrorToHttp(error)
  }
}

/** What the composer offers this sender: roles to pick and, for state/district staff, areas. */
export async function composerOptions(sender: Sender) {
  const roles = SENDABLE_ROLES[sender.role]
  const level = roles.length ? areaLevelFor(sender.role) : null
  let areas: { id: number; name: string }[] = []
  if (level === "district") {
    const rows = await query<Row>("SELECT id, name_hi, name_en FROM master_districts ORDER BY name_en")
    areas = rows.map((r) => ({ id: r.id, name: localizedName(r) }))
  } else if (level === "block" && sender.districtId) {
    const rows = await query<Row>(
      "SELECT id, name_hi, name_en FROM master_blocks WHERE district_id = ? ORDER BY name_en",
      [sender.districtId],
    )
    areas = rows.map((r) => ({ id: r.id, name: localizedName(r) }))
  }
  return { roles, areaLevel: level, areas }
}

/** How many people a notice would reach, and how many of them get a phone alert. */
export async function countAudience(sender: Sender, roles: readonly string[], areaId?: number | null) {
  const target = resolve(sender, roles, areaId)
  const from = audienceFrom(target.scope, target.roles, sender.id)
  const row = await one<Row>(
    `SELECT COUNT(*) AS people,
            COALESCE(SUM(EXISTS (SELECT 1 FROM tbl_push_subscriptions s
                                 WHERE s.user_id = u.id AND s.revoked_at IS NULL)), 0) AS phones
     ${from.sql}`,
    from.params,
  )
  return { people: Number(row?.people ?? 0), phones: Number(row?.phones ?? 0) }
}

export type BroadcastInput = {
  roles: string[]
  areaId?: number | null
  title: string
  body: string
}

/** Writes the notice, every recipient's inbox row and the push queue in one transaction. */
export async function sendBroadcast(
  author: Awaited<ReturnType<typeof loadSender>>,
  input: BroadcastInput,
) {
  const { sender } = author
  const target = resolve(sender, input.roles, input.areaId)

  const recent = await one<Row>(
    `SELECT COUNT(*) AS n FROM tbl_notifications
     WHERE actor_user_id = ? AND entity_type = 'broadcast' AND created_at > NOW() - INTERVAL 1 HOUR`,
    [sender.id],
  )
  if (Number(recent?.n ?? 0) >= HOURLY_LIMIT)
    throw new HttpError(429, msg("एक घंटे में अधिकतम {{n}} सूचनाएँ भेजी जा सकती हैं", { n: HOURLY_LIMIT }))

  const type = await one<Row>(
    "SELECT id, push_enabled FROM master_notification_types WHERE code = ? AND is_active = 1",
    [TYPE_CODE],
  )
  if (!type) throw new HttpError(503, msg("सूचना भेजना अभी बंद है"))

  const sent = await transaction(async (db) => {
    const created = await exec(
      `INSERT INTO tbl_notifications (type_id, payload, entity_type, actor_user_id)
       VALUES (?, ?, 'broadcast', ?)`,
      [
        type.id,
        JSON.stringify({
          title: input.title,
          body: input.body,
          sender: `${author.name}, ${author.designation}`,
          roles: target.roles.join(","),
          area: input.areaId ?? null,
        }),
        sender.id,
      ],
      db,
    )
    const notificationId = created.insertId
    const from = audienceFrom(target.scope, target.roles, sender.id)
    const fanned = await exec(
      `INSERT INTO tbl_notification_recipients (notification_id, user_id) SELECT ?, u.id ${from.sql}`,
      [notificationId, ...from.params],
      db,
    )
    if (!fanned.affectedRows) throw badRequest(msg("चुने गए समूह में कोई सक्रिय यूज़र नहीं है"))

    let queued = 0
    if (type.push_enabled) {
      const deliveries = await exec(
        `INSERT INTO tbl_notification_deliveries (recipient_id, subscription_id)
         SELECT r.id, s.id
         FROM tbl_notification_recipients r
         JOIN tbl_push_subscriptions s ON s.user_id = r.user_id AND s.revoked_at IS NULL
         WHERE r.notification_id = ?`,
        [notificationId],
        db,
      )
      queued = deliveries.affectedRows
    }
    return { id: notificationId, people: fanned.affectedRows, queued }
  })
  // Wake the push worker only after the commit, so it sees the new deliveries.
  if (sent.queued) notificationEvents.emit("queued")
  return sent
}

/** The sender's last notices with how many people received and read each one. */
export async function listSent(senderId: number) {
  const rows = await query<Row>(
    `SELECT n.id, n.payload, n.created_at,
            COUNT(r.id) AS people, COUNT(r.read_at) AS seen
     FROM tbl_notifications n
     LEFT JOIN tbl_notification_recipients r ON r.notification_id = n.id
     WHERE n.actor_user_id = ? AND n.entity_type = 'broadcast'
     GROUP BY n.id
     ORDER BY n.id DESC
     LIMIT 20`,
    [senderId],
  )
  return rows.map((r) => {
    const payload = JSON.parse(r.payload || "{}") as Record<string, string | null>
    return {
      id: r.id,
      title: payload.title ?? "",
      body: payload.body ?? "",
      roles: String(payload.roles ?? "").split(",").filter(Boolean) as Role[],
      people: Number(r.people),
      seen: Number(r.seen),
      sentAt: formatDate(r.created_at, true),
    }
  })
}
