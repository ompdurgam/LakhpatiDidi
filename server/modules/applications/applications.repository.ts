// SQL for applications and their events, documents and comments.
import { type Db, exec, one, query } from "../../db/pool.ts"
import { notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"

// List columns plus the live figures dashboards need: days past the SLA, the
// amount actually sanctioned, and whether the asset has started earning.
const LIST = `SELECT l.*, a.sanctioned_amount, a.department_id,
    GREATEST(DATEDIFF(CURDATE(), l.sla_due_on), 0) AS days_overdue,
    EXISTS (SELECT 1 FROM tbl_application_events e
            WHERE e.application_id = l.id AND e.event_type = 'income_active') AS income_active
  FROM v_application_list l JOIN tbl_applications a ON a.id = l.id`

/**
 * Applications, optionally only those inside `area` (district / block areas by the
 * routing block b, as on the dashboards; GP / village areas by the Didi's village gp / v)
 * and only those of `departmentIds`.
 */
export const listApplications = (
  area?: { sql: string; params: unknown[] } | null,
  departmentIds?: number[],
) =>
  query<Row>(
    `${LIST}
     WHERE ${departmentIds ? "a.department_id IN (?)" : "TRUE"}
     ${
       area
         ? `AND l.app_code IN (
              SELECT a2.app_code FROM tbl_applications a2
              JOIN tbl_households h          ON h.id  = a2.household_id
              JOIN master_villages v         ON v.id  = h.village_id
              JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
              JOIN master_blocks b           ON b.id  = a2.block_id
              WHERE ${area.sql})`
         : ""
     }
     ORDER BY l.received_on DESC, l.app_code DESC`,
    [
      ...(departmentIds ? [departmentIds.length ? departmentIds : [0]] : []),
      ...(area?.params ?? []),
    ],
  )

export const findListRow = (code: string) => one<Row>(`${LIST} WHERE l.app_code = ?`, [code])

/** Loads an application; with `forUpdate` the row is locked for the transaction. */
export async function findApplication(code: string, db?: Db, forUpdate = false) {
  const row = await one<Row>(
    `SELECT * FROM tbl_applications WHERE app_code = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [code],
    db,
  )
  if (!row) throw notFound(msg("आवेदन नहीं मिला"))
  return row
}

export const findOfficer = (id: number | null) =>
  id ? one<Row>("SELECT name, designation FROM master_users WHERE id = ?", [id]) : undefined

export const listEvents = (applicationId: number) =>
  query<Row>(
    `SELECT e.event_type, e.note, e.created_at, u.name AS actor
     FROM tbl_application_events e LEFT JOIN master_users u ON u.id = e.actor_user_id
     WHERE e.application_id = ? ORDER BY e.created_at, e.id`,
    [applicationId],
  )

export const listDocuments = (applicationId: number) =>
  query<Row>(
    "SELECT doc_type, is_verified FROM tbl_application_documents WHERE application_id = ? ORDER BY id",
    [applicationId],
  )

export const listComments = (applicationId: number) =>
  query<Row>(
    `SELECT c.id, c.body, c.created_at, u.name, u.role
     FROM tbl_application_comments c JOIN master_users u ON u.id = c.user_id
     WHERE c.application_id = ? ORDER BY c.created_at, c.id`,
    [applicationId],
  )

export const updateApplication = (id: number, fields: Record<string, unknown>, db: Db) =>
  exec(
    `UPDATE tbl_applications SET ${Object.keys(fields)
      .map((column) => `${column} = ?`)
      .join(", ")} WHERE id = ?`,
    [...Object.values(fields), id],
    db,
  )

export type NewEvent = {
  applicationId: number
  type: string
  fromStatus: string | null
  toStatus: string | null
  note: string | null
  actorId: number
}

export const insertEvent = (event: NewEvent, db?: Db) =>
  exec(
    `INSERT INTO tbl_application_events
       (application_id, event_type, from_status, to_status, note, actor_user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [event.applicationId, event.type, event.fromStatus, event.toStatus, event.note, event.actorId],
    db,
  )

export const insertComment = (applicationId: number, userId: number, body: string, db?: Db) =>
  exec(
    "INSERT INTO tbl_application_comments (application_id, user_id, body) VALUES (?, ?, ?)",
    [applicationId, userId, body],
    db,
  )

export const lockOpenApplications = (codes: string[], statuses: string[], db: Db) =>
  query<Row>(
    `SELECT id, app_code, subsidy_amount FROM tbl_applications
     WHERE app_code IN (?) AND status IN (?) FOR UPDATE`,
    [codes, statuses],
    db,
  )
