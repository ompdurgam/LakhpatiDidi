import { transaction } from "../../db/pool.ts"
import { badRequest, notFound } from "../../shared/errors.ts"
import { today } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { type ApplicationStatus, OPEN_STATUSES } from "./applications.labels.ts"
import { toApplicationDetail, toApplicationRow } from "./applications.mapper.ts"
import * as repo from "./applications.repository.ts"
import { actions, assertAllowed, isActionName } from "./applications.workflow.ts"

export async function listApplications() {
  return (await repo.listApplications()).map(toApplicationRow)
}

export async function getApplicationDetail(code: string) {
  const listRow = await repo.findListRow(code)
  if (!listRow) throw notFound(msg("आवेदन नहीं मिला"))
  const application = await repo.findApplication(code)
  const [officer, events, documents, comments] = await Promise.all([
    repo.findOfficer(application.assigned_officer_id),
    repo.listEvents(application.id),
    repo.listDocuments(application.id),
    repo.listComments(application.id),
  ])
  return toApplicationDetail({ listRow, application, officer, events, documents, comments })
}

/** Runs one workflow action inside a transaction; returns the success message. */
export async function performAction(code: string, body: Record<string, unknown>, actorId: number) {
  const name = body.action
  if (!isActionName(name)) throw badRequest(msg("अज्ञात कार्यवाही"))
  return transaction(async (db) => {
    const application = await repo.findApplication(code, db, true)
    assertAllowed(name, application.status as ApplicationStatus)
    const action = actions[name]
    // Each entry validates its own input before touching the database.
    const input = parse(action.schema, body)
    return (action.run as (i: unknown, c: unknown) => Promise<string>)(input, {
      application,
      actorId,
      db,
    })
  })
}

/** Sanctions every still-open application in `codes` at its subsidy amount. */
export async function bulkSanction(codes: string[], actorId: number) {
  if (!codes.length) throw badRequest(msg("कोई आवेदन नहीं चुना गया"))
  const sanctioned = await transaction(async (db) => {
    const rows = await repo.lockOpenApplications(codes, OPEN_STATUSES, db)
    for (const a of rows) {
      const orderNo = `BULK/${today().replace(/-/g, "")}/${a.id}`
      await repo.updateApplication(
        a.id,
        {
          status: "sanctioned",
          sanction_order_no: orderNo,
          sanction_date: today(),
          sanctioned_amount: a.subsidy_amount,
        },
        db,
      )
      await repo.insertEvent(
        {
          applicationId: a.id,
          type: "sanctioned",
          fromStatus: "under_review",
          toStatus: "sanctioned",
          note: `सामूहिक स्वीकृति • आदेश सं. ${orderNo}`,
          actorId,
        },
        db,
      )
    }
    return rows.map((r) => r.app_code as string)
  })
  return { sanctioned, skipped: codes.filter((c) => !sanctioned.includes(c)) }
}

export async function addComment(code: string, userId: number, body: string) {
  const application = await repo.findApplication(code)
  await repo.insertComment(application.id, userId, body)
}
