import { exec, one, transaction } from "../../db/pool.ts"
import { badRequest, conflict, notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { notifyApplication } from "../notifications/notifications.applications.ts"
import { leverage, recommend } from "../recommendations/engine.ts"
import { type Household, loadHousehold, toProfile } from "../recommendations/household.ts"
import { ruleFor } from "../recommendations/schemeRules.ts"
import { loadSchemes } from "../recommendations/schemes.ts"
import {
  type CostItem,
  defaultCostItems,
  defaultProjectCost,
  financing,
  paybackMonths,
  totalOf,
} from "./costs.ts"

export type SaveInput = { step: number; items: CostItem[]; remarks: string; documents: string[] }

/** Household + scheme for a DPR; 404 when either is unknown or the scheme needs no DPR. */
async function resolve(code: string, schemeCode: string) {
  const [household, schemes] = await Promise.all([loadHousehold(code), loadSchemes()])
  if (!household) throw notFound(msg("परिवार नहीं मिला"))
  const scheme = schemes.get(schemeCode)
  if (!scheme || !ruleFor(schemeCode)) throw notFound(msg("इस योजना के लिए DPR नहीं बनता"))
  return { household, scheme }
}

const existingApplication = (householdId: number, schemeId: number) =>
  one<Row>(
    "SELECT id, app_code, status FROM tbl_applications WHERE household_id = ? AND scheme_id = ? LIMIT 1",
    [householdId, schemeId],
  )

const draftOf = (householdId: number, schemeId: number) =>
  one<Row>("SELECT * FROM tbl_dpr_drafts WHERE household_id = ? AND scheme_id = ?", [
    householdId,
    schemeId,
  ])

function fitFor(h: Household, schemeCode: string) {
  const fit = recommend(toProfile(h)).find((r) => r.code === schemeCode)
  const rule = ruleFor(schemeCode)!
  // Not currently recommended (e.g. her income changed): show the scheme's own figures.
  return fit ?? { ...rule.fit(toProfile(h))!, code: schemeCode, gain: rule.gain, score: 0 }
}

/** Everything the DPR screens need: household facts, scheme, the draft and the money. */
export async function getDpr(code: string, schemeCode: string) {
  const { household: h, scheme } = await resolve(code, schemeCode)
  const [application, draft] = await Promise.all([
    existingApplication(h.id, scheme.id),
    draftOf(h.id, scheme.id),
  ])
  const fit = fitFor(h, schemeCode)

  const saved: CostItem[] = draft ? JSON.parse(draft.cost_items) : []
  const items = saved.length
    ? saved
    : defaultCostItems(schemeCode, defaultProjectCost(scheme.maxCost))
  const money = financing(totalOf(items), scheme.subsidyPercent, scheme.maxCost)
  const lev = leverage(h.income, [{ code: schemeCode, gain: fit.gain }])

  return {
    household: {
      code: h.code,
      name: h.name,
      initials: h.initials,
      guardian: h.guardian,
      mobile: h.mobile,
      category: h.category,
      special: h.special === "NONE" ? null : h.special,
      village: h.village,
      panchayat: h.panchayat,
      block: h.block,
      district: h.district,
      shg: h.shg,
      vo: h.vo,
      income: h.income,
    },
    scheme: {
      code: scheme.code,
      name: scheme.name,
      department: scheme.department,
      subsidyPercent: scheme.subsidyPercent,
      maxCost: scheme.maxCost,
      slaDays: scheme.slaDays,
      office: fit.office,
    },
    fit: { score: fit.score, why: fit.why, checks: fit.checks, docs: fit.docs, gain: fit.gain },
    economics: {
      income: h.income,
      gain: fit.gain,
      projected: lev.projected,
      reachesTarget: lev.reachesTarget,
      paybackMonths: paybackMonths(money, fit.gain),
      monthlyLoan: Math.round(money.bank / 36),
    },
    money,
    draft: {
      status: application ? "sent" : ((draft?.status as string | undefined) ?? "new"),
      step: draft ? Number(draft.current_step) : 1,
      items,
      remarks: (draft?.remarks as string | null) ?? "",
      documents: draft ? (JSON.parse(draft.documents) as string[]) : [],
    },
    application: application
      ? { code: application.app_code as string, status: application.status as string }
      : null,
  }
}

/** Saves the DPR in progress. Reaching the last step with a project cost makes it "filled". */
export async function saveDpr(code: string, schemeCode: string, input: SaveInput, userId: number) {
  const { household: h, scheme } = await resolve(code, schemeCode)
  if (await existingApplication(h.id, scheme.id))
    throw conflict(msg("इस योजना का आवेदन पहले ही भेजा जा चुका है"))
  const total = totalOf(input.items)
  const status = input.step >= 7 && total > 0 ? "filled" : "draft"
  await exec(
    `INSERT INTO tbl_dpr_drafts (household_id, scheme_id, status, current_step, cost_items, remarks, documents, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), current_step = VALUES(current_step),
       cost_items = VALUES(cost_items), remarks = VALUES(remarks), documents = VALUES(documents),
       updated_by = VALUES(updated_by)`,
    [
      h.id,
      scheme.id,
      status,
      input.step,
      JSON.stringify(input.items),
      input.remarks,
      JSON.stringify(input.documents),
      userId,
    ],
  )
  return { status, step: input.step, total }
}

async function nextApplicationCode(db: Parameters<Parameters<typeof transaction>[0]>[0]) {
  const row = await one<Row>(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(app_code, 5) AS UNSIGNED)), 260000) + 1 AS next FROM tbl_applications FOR UPDATE",
    [],
    db,
  )
  return `APP-${row?.next}`
}

/** Turns a filled DPR into an application routed to the scheme's department and block officer. */
export async function sendDpr(code: string, schemeCode: string, userId: number) {
  const { household: h, scheme } = await resolve(code, schemeCode)
  const draft = await draftOf(h.id, scheme.id)
  if (draft?.status === "sent" || (await existingApplication(h.id, scheme.id)))
    throw conflict(msg("इस योजना का आवेदन पहले ही भेजा जा चुका है"))
  if (!draft || draft.status !== "filled") throw badRequest(msg("पहले DPR के सभी चरण पूरे करें"))
  const items: CostItem[] = JSON.parse(draft.cost_items)
  const money = financing(totalOf(items), scheme.subsidyPercent, scheme.maxCost)
  if (money.total <= 0) throw badRequest(msg("परियोजना लागत शून्य नहीं हो सकती"))
  const gain = fitFor(h, schemeCode).gain

  return transaction(async (db) => {
    // Lock the draft row so a double-tap on "send" cannot create two applications.
    const locked = await one<Row>(
      "SELECT status FROM tbl_dpr_drafts WHERE id = ? FOR UPDATE",
      [draft.id],
      db,
    )
    if (locked?.status === "sent" || (await existingApplication(h.id, scheme.id)))
      throw conflict(msg("इस योजना का आवेदन पहले ही भेजा जा चुका है"))

    const officer = await one<Row>(
      `SELECT m.officer_user_id, u.name FROM master_officer_mappings m
       JOIN master_users u ON u.id = m.officer_user_id
       WHERE m.block_id = ? AND m.department_id = ? AND m.is_active = 1
         AND (m.scheme_id = ? OR m.scheme_id IS NULL)
       ORDER BY m.scheme_id IS NULL LIMIT 1`,
      [h.blockId, scheme.departmentId, scheme.id],
      db,
    )
    const appCode = await nextApplicationCode(db)
    const created = await exec(
      `INSERT INTO tbl_applications
         (app_code, household_id, scheme_id, department_id, block_id, project_cost, subsidy_amount,
          expected_income_gain, status, received_on, sla_due_on, assigned_officer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', CURDATE(), CURDATE() + INTERVAL ? DAY, ?)`,
      [
        appCode,
        h.id,
        scheme.id,
        scheme.departmentId,
        h.blockId,
        money.total,
        money.subsidy,
        gain,
        scheme.slaDays,
        officer?.officer_user_id ?? null,
      ],
      db,
    )
    await exec(
      `INSERT INTO tbl_application_events (application_id, event_type, to_status, note, actor_user_id)
       VALUES (?, 'dpr_submitted', 'submitted', ?, ?)`,
      [created.insertId, "DPR जमा (फील्ड सर्वेयर द्वारा)", userId],
      db,
    )
    await notifyApplication(created.insertId, "submitted", { actorId: userId }, db)
    await exec(
      "UPDATE tbl_dpr_drafts SET status = 'sent', application_id = ?, updated_by = ? WHERE id = ?",
      [created.insertId, userId, draft.id],
      db,
    )
    const sla = await one<Row>(
      "SELECT sla_due_on FROM tbl_applications WHERE id = ?",
      [created.insertId],
      db,
    )
    return {
      applicationCode: appCode,
      department: scheme.department,
      office: fitFor(h, schemeCode).office,
      officer: (officer?.name as string | undefined) ?? null,
      slaDue: String(sla?.sla_due_on).slice(0, 10),
      scheme: scheme.name,
      didi: h.name,
    }
  })
}
