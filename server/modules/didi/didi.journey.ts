// A Didi's income journey (monthly income, last 12 months) and her entitlements
// checklist (every section D answer of her latest survey).
import { one, query } from "../../db/pool.ts"
import { localizedName } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { schemeAnswers } from "../surveys/surveys.details.ts"

/** Monthly totals from the income register, oldest first (YYYY-MM). */
export async function monthlyIncome(householdId: number) {
  const rows = await query<Row>(
    `SELECT DATE_FORMAT(month, '%Y-%m') AS month, SUM(amount) AS amount
     FROM tbl_monthly_income_entries
     WHERE household_id = ? AND month >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
     GROUP BY month ORDER BY month`,
    [householdId],
  )
  return rows.map((r) => ({ month: r.month as string, amount: Number(r.amount) }))
}

export type EntitlementStatus = "received" | "pending" | "missing"

/**
 * Every entitlement asked about in her latest survey: received, applied (pending)
 * or not applied (missing), with the department that provides it.
 */
export async function entitlements(householdId: number) {
  const survey = await one<Row>(
    `SELECT responses FROM tbl_surveys
     WHERE household_id = ? AND status = 'submitted' ORDER BY id DESC LIMIT 1`,
    [householdId],
  )
  if (!survey) return []
  const answers = schemeAnswers(JSON.parse(survey.responses))
  if (!answers.length) return []
  const schemes = await query<Row>(
    `SELECT s.name_hi, s.name_en, d.name_hi AS dept_hi, d.name_en AS dept_en
     FROM master_schemes s JOIN master_departments d ON d.id = s.department_id
     WHERE s.name_hi IN (?)`,
    [answers.map((a) => a.scheme)],
  )
  const byName = new Map(schemes.map((s) => [s.name_hi as string, s]))
  const status = (answer: string): EntitlementStatus =>
    answer === "प्राप्त" ? "received" : answer === "आवेदन लंबित" ? "pending" : "missing"
  return answers
    .map((a) => {
      const s = byName.get(a.scheme)
      return {
        name: s ? localizedName(s) : a.scheme,
        department: s ? localizedName(s, "dept") : "",
        status: status(a.status),
      }
    })
    .sort((x, y) => ORDER[x.status] - ORDER[y.status])
}

/** Missing first (what she should apply for), then pending, then received. */
const ORDER: Record<EntitlementStatus, number> = { missing: 0, pending: 1, received: 2 }
