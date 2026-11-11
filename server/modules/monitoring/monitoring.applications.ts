// Application-side dashboard figures: the funnel after the survey, department
// performance, department × child-area pendency and escalations.
import { query } from "../../db/pool.ts"
import { localizedName } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import type { Area } from "./monitoring.area.ts"

const OPEN = "a.status IN ('submitted','under_review','info_requested')"
const OVERDUE = `(${OPEN} AND CURDATE() > a.sla_due_on)`
const SANCTIONED = "a.status IN ('sanctioned','delivered')"

// Applications inside the area (routed by block).
const AREA_APPS = `tbl_applications a JOIN master_blocks b ON b.id = a.block_id`

// A household-linked table (alias i) placed up to its block (alias b).
const HOUSEHOLD_PLACE = `JOIN tbl_households h          ON h.id  = i.household_id
  JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id`

const childColumn = (area: Area) =>
  area.level === "state" ? "b.district_id" : area.level === "district" ? "b.id" : null

/** Funnel counts from scheme suggestion to income, plus sanctioned money. */
export async function applicationFunnel(area: Area) {
  const [interest] = await query<Row>(
    `SELECT COUNT(DISTINCT i.household_id) AS asked,
            COUNT(DISTINCT IF(i.status = 'interested', i.household_id, NULL)) AS interested
     FROM tbl_scheme_interests i
     JOIN tbl_households h          ON h.id  = i.household_id
     JOIN master_villages v         ON v.id  = h.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b           ON b.id  = gp.block_id
     WHERE ${area.blockFilter}`,
    area.params,
  )
  const [apps] = await query<Row>(
    `SELECT COUNT(DISTINCT a.household_id) AS dpr,
            COUNT(DISTINCT IF(${SANCTIONED}, a.household_id, NULL)) AS sanctioned,
            COUNT(DISTINCT IF(a.status = 'delivered', a.household_id, NULL)) AS delivered,
            COUNT(DISTINCT IF(EXISTS (SELECT 1 FROM tbl_application_events e
                                      WHERE e.application_id = a.id AND e.event_type = 'income_active'),
                              a.household_id, NULL)) AS income_active,
            COUNT(*) AS applications,
            SUM(${SANCTIONED}) AS sanctioned_apps,
            SUM(a.status = 'delivered') AS delivered_apps,
            SUM(${OVERDUE}) AS overdue,
            COALESCE(SUM(IF(${SANCTIONED}, COALESCE(a.sanctioned_amount, a.subsidy_amount), 0)), 0) AS amount,
            COUNT(DISTINCT IF(${SANCTIONED}, a.department_id, NULL)) AS departments
     FROM ${AREA_APPS} WHERE ${area.blockFilter}`,
    area.params,
  )
  return {
    asked: Number(interest.asked),
    interested: Number(interest.interested),
    dpr: Number(apps.dpr),
    sanctioned: Number(apps.sanctioned),
    delivered: Number(apps.delivered),
    incomeActive: Number(apps.income_active),
    applications: Number(apps.applications),
    sanctionedApplications: Number(apps.sanctioned_apps),
    deliveredApplications: Number(apps.delivered_apps),
    overdue: Number(apps.overdue),
    sanctionedAmount: Number(apps.amount),
    activeDepartments: Number(apps.departments),
  }
}

/** Per department: received / pending / overdue, ₹ sanctioned, speed and on-time rate. */
export async function departmentPerformance(area: Area) {
  const rows = await query<Row>(
    `SELECT d.code, d.name_hi, d.name_en,
            COUNT(*) AS received,
            SUM(${OPEN}) AS pending,
            SUM(${OVERDUE}) AS overdue,
            COALESCE(SUM(IF(${SANCTIONED}, COALESCE(a.sanctioned_amount, a.subsidy_amount), 0)), 0) AS amount,
            AVG(IF(a.sanction_date IS NULL, NULL, DATEDIFF(a.sanction_date, a.received_on))) AS avg_days,
            SUM(a.sanction_date IS NOT NULL AND a.sanction_date <= a.sla_due_on) AS on_time,
            SUM(a.sanction_date IS NOT NULL) AS decided
     FROM ${AREA_APPS} JOIN master_departments d ON d.id = a.department_id
     WHERE ${area.blockFilter}
     GROUP BY d.id ORDER BY received DESC`,
    area.params,
  )
  return rows.map((r) => ({
    code: r.code as string,
    name: localizedName(r),
    received: Number(r.received),
    pending: Number(r.pending),
    overdue: Number(r.overdue),
    sanctionedAmount: Number(r.amount),
    avgSanctionDays: r.avg_days === null ? null : Math.round(Number(r.avg_days) * 10) / 10,
    onTimePct: Number(r.decided) ? Math.round((Number(r.on_time) / Number(r.decided)) * 100) : null,
  }))
}

/** Sanctioned / pending / overdue applications per department × child area. */
export async function departmentMatrix(area: Area) {
  const column = childColumn(area)
  if (!column) return []
  const rows = await query<Row>(
    `SELECT d.code AS dept, ${column} AS child_id,
            SUM(${SANCTIONED}) AS sanctioned, SUM(${OPEN}) AS pending, SUM(${OVERDUE}) AS overdue
     FROM ${AREA_APPS} JOIN master_departments d ON d.id = a.department_id
     WHERE ${area.blockFilter}
     GROUP BY d.id, child_id`,
    area.params,
  )
  return rows.map((r) => ({
    dept: r.dept as string,
    childId: r.child_id as number,
    sanctioned: Number(r.sanctioned),
    pending: Number(r.pending),
    overdue: Number(r.overdue),
  }))
}

/** Overdue applications, longest overdue first. */
export async function escalations(area: Area, limit = 8) {
  const rows = await query<Row>(
    `SELECT a.app_code, a.escalation_level, DATEDIFF(CURDATE(), a.sla_due_on) AS days_overdue,
            d.name_hi, d.name_en, s.name_hi AS scheme_hi, s.name_en AS scheme_en
     FROM ${AREA_APPS}
     JOIN master_departments d ON d.id = a.department_id
     JOIN master_schemes s     ON s.id = a.scheme_id
     WHERE ${area.blockFilter} AND ${OVERDUE}
     ORDER BY a.sla_due_on LIMIT ${Number(limit)}`,
    area.params,
  )
  return rows.map((r) => ({
    code: r.app_code as string,
    department: localizedName(r),
    scheme: localizedName(r, "scheme"),
    daysOverdue: Number(r.days_overdue),
    escalation: r.escalation_level as string,
  }))
}

/** Open applications due within `days`, and sanctioned ones awaiting delivery. */
export async function deadlines(area: Area, days = 3) {
  const [r] = await query<Row>(
    `SELECT SUM(${OPEN} AND a.sla_due_on BETWEEN CURDATE() AND CURDATE() + INTERVAL ? DAY) AS due_soon,
            SUM(a.status = 'sanctioned') AS awaiting_delivery
     FROM ${AREA_APPS} WHERE ${area.blockFilter}`,
    [days, ...area.params],
  )
  return { dueSoon: Number(r.due_soon ?? 0), awaitingDelivery: Number(r.awaiting_delivery ?? 0) }
}

/**
 * Per scheme: Didis suggested / interested, applications at each stage, ₹ sanctioned,
 * and open / closed entitlement gaps. Schemes with no activity are left out.
 */
export async function schemeConvergence(area: Area) {
  const rows = await query<Row>(
    `SELECT s.code, s.name_hi, s.name_en, d.name_hi AS dept_hi, d.name_en AS dept_en,
            COALESCE(i.asked, 0) AS asked, COALESCE(i.interested, 0) AS interested,
            COALESCE(ap.dpr, 0) AS dpr, COALESCE(ap.sanctioned, 0) AS sanctioned,
            COALESCE(ap.delivered, 0) AS delivered, COALESCE(ap.amount, 0) AS amount,
            COALESCE(g.open, 0) AS gaps_open, COALESCE(g.closed, 0) AS gaps_closed
     FROM master_schemes s
     JOIN master_departments d ON d.id = s.department_id
     LEFT JOIN (SELECT i.scheme_id, COUNT(*) AS asked, SUM(i.status = 'interested') AS interested
                FROM tbl_scheme_interests i ${HOUSEHOLD_PLACE} WHERE ${area.blockFilter}
                GROUP BY i.scheme_id) i ON i.scheme_id = s.id
     LEFT JOIN (SELECT a.scheme_id, COUNT(*) AS dpr, SUM(${SANCTIONED}) AS sanctioned,
                       SUM(a.status = 'delivered') AS delivered,
                       SUM(IF(${SANCTIONED}, COALESCE(a.sanctioned_amount, a.subsidy_amount), 0)) AS amount
                FROM ${AREA_APPS} WHERE ${area.blockFilter}
                GROUP BY a.scheme_id) ap ON ap.scheme_id = s.id
     LEFT JOIN (SELECT g.scheme_id, SUM(g.status = 'open') AS open, SUM(g.status = 'closed') AS closed
                FROM tbl_entitlement_gaps g ${HOUSEHOLD_PLACE.replace("i.household_id", "g.household_id")}
                WHERE ${area.blockFilter}
                GROUP BY g.scheme_id) g ON g.scheme_id = s.id
     WHERE i.scheme_id IS NOT NULL OR ap.scheme_id IS NOT NULL OR g.scheme_id IS NOT NULL
     ORDER BY dpr DESC, asked DESC, gaps_open DESC`,
    [...area.params, ...area.params, ...area.params],
  )
  return rows.map((r) => ({
    code: r.code as string,
    name: localizedName(r),
    department: localizedName(r, "dept"),
    asked: Number(r.asked),
    interested: Number(r.interested),
    dpr: Number(r.dpr),
    sanctioned: Number(r.sanctioned),
    delivered: Number(r.delivered),
    sanctionedAmount: Number(r.amount),
    gapsOpen: Number(r.gaps_open),
    gapsClosed: Number(r.gaps_closed),
  }))
}
