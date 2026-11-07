// Application notices: who hears about each workflow step, and with what parameters.
import { type Db, one, pool, query } from "../../db/pool.ts"
import { inr } from "../../shared/format.ts"
import type { Role, Row } from "../../shared/types.ts"
import { applicationLink } from "./notifications.model.ts"
import { notify, type Recipient } from "./notifications.service.ts"

type Audience = "officer" | "block" | "field" | "didi" | "district"

/** Who is told about each application event. */
export const APPLICATION_AUDIENCE = {
  submitted: ["officer"],
  accepted: ["field", "block", "didi"],
  info_requested: ["field", "block"],
  sanctioned: ["field", "block", "didi"],
  rejected: ["field", "block", "didi"],
  delivered: ["field", "block", "didi"],
  escalated: ["officer", "block", "district"],
  follow_up: ["officer"],
  overdue: ["officer", "block"],
} satisfies Record<string, Audience[]>

export type ApplicationEvent = keyof typeof APPLICATION_AUDIENCE

export const isApplicationEvent = (value: string): value is ApplicationEvent =>
  value in APPLICATION_AUDIENCE

const loadApplication = (applicationId: number, db: Db) =>
  one<Row>(
    `SELECT a.id, a.app_code, a.assigned_officer_id, a.sla_due_on, a.block_id, a.department_id,
            a.sanctioned_amount, h.didi_name, h.didi_name_en, h.mobile, h.village_id,
            s.name_hi AS scheme_hi, s.name_en AS scheme_en, d.code AS dept_code, b.district_id
     FROM tbl_applications a
     JOIN tbl_households h     ON h.id = a.household_id
     JOIN master_schemes s     ON s.id = a.scheme_id
     JOIN master_departments d ON d.id = a.department_id
     JOIN master_blocks b      ON b.id = a.block_id
     WHERE a.id = ?`,
    [applicationId],
    db,
  )

/** Active users in one audience group of this application. */
function audienceUsers(group: Audience, app: Row, db: Db) {
  const active = "status = 'active'"
  switch (group) {
    case "officer":
      return app.assigned_officer_id
        ? query<Row>(
            `SELECT id, role FROM master_users WHERE id = ? AND ${active}`,
            [app.assigned_officer_id],
            db,
          )
        : // No mapped officer: every officer of the department in this district.
          query<Row>(
            `SELECT id, role FROM master_users WHERE role = 'department' AND department_id = ?
               AND (district_id = ? OR district_id IS NULL) AND ${active}`,
            [app.department_id, app.district_id],
            db,
          )
    case "block":
      return query<Row>(
        `SELECT id, role FROM master_users WHERE role = 'block' AND block_id = ? AND ${active}`,
        [app.block_id],
        db,
      )
    case "field":
      return query<Row>(
        `SELECT id, role FROM master_users WHERE role = 'field' AND village_id = ? AND ${active}`,
        [app.village_id],
        db,
      )
    case "district":
      return query<Row>(
        `SELECT id, role FROM master_users WHERE role = 'district' AND district_id = ? AND ${active}`,
        [app.district_id],
        db,
      )
    case "didi":
      return app.mobile
        ? query<Row>(
            `SELECT id, role FROM master_users WHERE role = 'didi' AND mobile = ? AND ${active}`,
            [app.mobile],
            db,
          )
        : Promise.resolve([] as Row[])
  }
}

const ddmmyyyy = (date: unknown) =>
  String(date ?? "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("-")

/**
 * Notifies everyone concerned with an application event.
 * Call with the transaction connection so the notice commits with the change.
 */
export async function notifyApplication(
  applicationId: number,
  event: ApplicationEvent,
  options: { actorId?: number | null; note?: string | null; dedupeKey?: string } = {},
  db: Db = pool,
) {
  const app = await loadApplication(applicationId, db)
  if (!app) return null
  const groups = await Promise.all(
    APPLICATION_AUDIENCE[event].map((g) => audienceUsers(g, app, db)),
  )
  const recipients: Recipient[] = groups.flat().map((u) => ({
    userId: Number(u.id),
    link: applicationLink(u.role as Role, app.app_code, app.dept_code),
  }))
  return notify(
    {
      type: `application.${event}`,
      payload: {
        code: app.app_code,
        didi: app.didi_name,
        didi_en: app.didi_name_en || null,
        scheme: app.scheme_hi,
        scheme_en: app.scheme_en || null,
        due: ddmmyyyy(app.sla_due_on),
        amount: app.sanctioned_amount ? inr(Number(app.sanctioned_amount)) : null,
        note: options.note ?? null,
      },
      entity: { type: "application", ref: app.app_code },
      actorId: options.actorId,
      dedupeKey: options.dedupeKey,
      recipients,
    },
    db,
  )
}
