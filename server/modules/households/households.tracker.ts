// One Didi's journey: milestones, income sources, applications, entitlement
// gaps and the monthly income register (read and append).
import { exec, one, query } from "../../db/pool.ts"
import { badRequest, notFound } from "../../shared/errors.ts"
import { formatDate, initials } from "../../shared/format.ts"
import { localized, localizedName, msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { statusHi } from "../applications/applications.labels.ts"
import { lifecycleHi, type LifecycleStatus } from "./households.labels.ts"

const date = (value: unknown) => (value ? formatDate(value as string) : null)

async function findHousehold(code: string) {
  const h = await one<Row>(
    `SELECT h.*, v.name_hi AS village_name, v.name_en AS village_name_en
     FROM tbl_households h JOIN master_villages v ON v.id = h.village_id
     WHERE h.hh_code = ?`,
    [code],
  )
  if (!h) throw notFound(msg("परिवार नहीं मिला"))
  return h
}

export async function getTracker(code: string) {
  const h = await findHousehold(code)
  const [steps, sources, applications, gaps, monthly] = await Promise.all([
    one<Row>(
      `SELECT
         (SELECT MIN(asked_at) FROM tbl_scheme_interests WHERE household_id = ?) AS suggested,
         (SELECT MIN(responded_at) FROM tbl_scheme_interests
            WHERE household_id = ? AND status = 'interested') AS consented,
         (SELECT MIN(received_on) FROM tbl_applications WHERE household_id = ?) AS dpr,
         (SELECT MIN(e.created_at) FROM tbl_application_events e
            JOIN tbl_applications a ON a.id = e.application_id
            WHERE a.household_id = ? AND e.event_type = 'blcc_action') AS blcc,
         (SELECT MIN(sanction_date) FROM tbl_applications WHERE household_id = ?) AS sanctioned,
         (SELECT MIN(delivered_on) FROM tbl_applications WHERE household_id = ?) AS delivered,
         (SELECT MIN(e.created_at) FROM tbl_application_events e
            JOIN tbl_applications a ON a.id = e.application_id
            WHERE a.household_id = ? AND e.event_type = 'income_active') AS income_active`,
      Array(7).fill(h.id),
    ),
    query<Row>(
      `SELECT source_name, net_income FROM tbl_household_income_sources
       WHERE household_id = ? AND financial_year =
             (SELECT MAX(financial_year) FROM tbl_household_income_sources WHERE household_id = ?)
       ORDER BY net_income DESC`,
      [h.id, h.id],
    ),
    query<Row>(`SELECT * FROM v_application_list WHERE hh_code = ? ORDER BY received_on DESC`, [
      h.hh_code,
    ]),
    query<Row>(
      `SELECT g.status, g.identified_on, g.closed_on, s.name_hi, s.name_en,
              d.name_hi AS dept_hi, d.name_en AS dept_en
       FROM tbl_entitlement_gaps g
       JOIN master_schemes s ON s.id = g.scheme_id
       JOIN master_departments d ON d.id = s.department_id
       WHERE g.household_id = ? ORDER BY g.status = 'open' DESC, g.identified_on DESC`,
      [h.id],
    ),
    query<Row>(
      `SELECT DATE_FORMAT(month, '%Y-%m') AS month, source_name, amount
       FROM tbl_monthly_income_entries
       WHERE household_id = ? AND month >= DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01')
       ORDER BY month DESC, source_name`,
      [h.id],
    ),
  ])
  const lakhpati = h.lifecycle_status === "lakhpati"
  return {
    profile: {
      code: h.hh_code as string,
      name: localized(h, "didi_name"),
      initials: initials(h.didi_name_en, h.didi_name),
      village: localized(h, "village_name"),
      income: Number(h.current_annual_income),
      surveyed: Boolean(h.surveyed_at),
      status: msg(lifecycleHi[h.lifecycle_status as LifecycleStatus] ?? h.lifecycle_status),
    },
    milestones: [
      ["सर्वे", h.surveyed_at],
      ["सुझाव", steps?.suggested],
      ["सहमति", steps?.consented],
      ["DPR भेजा", steps?.dpr],
      ["BLCC", steps?.blcc],
      ["स्वीकृत", steps?.sanctioned],
      ["डिलीवरी", steps?.delivered],
      ["आय सक्रिय", steps?.income_active],
      ["लखपति", lakhpati ? h.updated_at : null],
    ].map(([label, at]) => ({ label: label as string, date: date(at) })), // Hindi keys; the UI translates
    sources: sources.map((s) => ({ name: s.source_name as string, amount: Number(s.net_income) })),
    applications: applications.map((a) => ({
      code: a.app_code as string,
      scheme: localized(a, "scheme_name"),
      department: localized(a, "department_name"),
      status: msg(statusHi[a.status as keyof typeof statusHi]),
      overdue: Boolean(a.is_overdue),
      days: Math.max(0, Number(a.days_pending)),
    })),
    gaps: gaps.map((g) => ({
      scheme: localizedName(g),
      department: localizedName(g, "dept"),
      open: g.status === "open",
      date: date(g.status === "open" ? g.identified_on : g.closed_on),
    })),
    monthly: monthly.map((m) => ({
      month: m.month as string,
      source: m.source_name as string,
      amount: Number(m.amount),
    })),
  }
}

/** Records (or corrects) one source's income for the current month. */
export async function addMonthlyIncome(code: string, body: unknown, userId: number) {
  const { source, amount } = (body ?? {}) as { source?: unknown; amount?: unknown }
  const name = typeof source === "string" ? source.trim() : ""
  const value = Number(amount)
  if (!name || name.length > 80) throw badRequest(msg("आय स्रोत चुनें"))
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000)
    throw badRequest(msg("मान्य राशि दर्ज करें"))
  const h = await findHousehold(code)
  await exec(
    `INSERT INTO tbl_monthly_income_entries (household_id, month, source_name, amount, recorded_by)
     VALUES (?, DATE_FORMAT(CURDATE(), '%Y-%m-01'), ?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount), recorded_by = VALUES(recorded_by)`,
    [h.id, name, value, userId],
  )
}
