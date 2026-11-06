// Turns database rows into the shapes the UI renders.
import { formatDate, initials, inr, today } from "../../shared/format.ts"
import { localized, msg } from "../../shared/i18n.ts"
import { type Role, roleLabels, type Row } from "../../shared/types.ts"
import {
  type ApplicationStatus,
  escalationHi,
  type EscalationLevel,
  OVERDUE_HI,
  statusHi,
} from "./applications.labels.ts"

/** One row of v_application_list → list item. */
export function toApplicationRow(r: Row) {
  return {
    id: r.app_code as string,
    name: localized(r, "didi_name"),
    initials: initials(r.didi_name_en, r.didi_name),
    village: localized(r, "village_name"),
    scheme: localized(r, "scheme_name"),
    dept: localized(r, "department_name"),
    block: localized(r, "block_name"),
    days: Math.max(0, Number(r.days_pending)),
    status: msg(r.is_overdue ? OVERDUE_HI : statusHi[r.status as ApplicationStatus]),
    statusCode: r.status as ApplicationStatus,
    overdue: Boolean(r.is_overdue),
    amount: inr(r.project_cost),
    subsidy: inr(r.subsidy_amount),
    received: formatDate(r.received_on),
    hhCode: r.hh_code as string,
  }
}

export type TimelineStep = { label: string; date: string; state: "done" | "active" | "" }

/** Six-step progress strip built from the event history. */
export function buildTimeline(application: Row, events: Row[]): TimelineStep[] {
  const first = (...types: string[]) =>
    events.find((e) => types.includes(e.event_type))?.created_at as string | undefined
  const rejected = application.status === "rejected"
  const order = application.sanction_order_no
    ? ` (${application.sanction_order_no})`
    : ` (${msg("आदेश सं.")})`
  const steps: [string, string | undefined][] = [
    [msg("DPR जमा"), first("dpr_submitted")],
    [msg("BLCC कार्रवाई"), first("blcc_action")],
    [msg("विभागीय समीक्षा"), first("review", "accepted", "info_requested")],
    [
      rejected ? msg("अस्वीकृत") : `${msg("स्वीकृत")}${order}`,
      first(rejected ? "rejected" : "sanctioned"),
    ],
    [msg("डिलीवरी (फोटो)"), first("delivered")],
    [msg("आय सक्रिय"), first("income_active")],
  ]
  let activeAssigned = false
  return steps.map(([label, at]) => {
    if (at) return { label, date: formatDate(at), state: "done" }
    const state = !activeAssigned && !rejected ? "active" : ""
    activeAssigned = true
    return { label, date: msg("लंबित"), state }
  })
}

type DetailParts = {
  listRow: Row
  application: Row
  officer?: Row
  events: Row[]
  documents: Row[]
  comments: Row[]
}

/** Full application detail for the drawer. */
export function toApplicationDetail({
  listRow,
  application: a,
  officer,
  events,
  documents,
  comments,
}: DetailParts) {
  const income = Number(listRow.current_annual_income)
  return {
    ...toApplicationRow(listRow),
    escalation: msg(escalationHi[a.escalation_level as EscalationLevel]),
    slaDue: formatDate(a.sla_due_on),
    daysToSla: Math.round((Date.parse(a.sla_due_on) - Date.parse(today())) / 86_400_000),
    currentIncome: income,
    projectedIncome: income + Number(a.expected_income_gain),
    expectedGain: Number(a.expected_income_gain),
    officer: officer ? `${officer.name}, ${officer.designation}` : msg("नोडल अधिकारी (अनिर्दिष्ट)"),
    gpdpRef: a.gpdp_ref,
    vprpRef: a.vprp_ref,
    sanction: a.sanction_order_no
      ? {
          orderNo: a.sanction_order_no,
          date: formatDate(a.sanction_date),
          amount: inr(a.sanctioned_amount),
        }
      : null,
    rejectionReason: a.rejection_reason,
    delivery: a.delivered_on
      ? {
          date: formatDate(a.delivered_on),
          asset: a.asset_description,
          lat: a.geo_lat,
          lng: a.geo_lng,
        }
      : null,
    timeline: buildTimeline(a, events),
    documents: documents.map((d) => ({ name: d.doc_type, verified: Boolean(d.is_verified) })),
    comments: comments.map((c) => ({
      id: c.id,
      author: c.name,
      initials: initials(null, c.name),
      fromOfficer: c.role !== "field",
      roleLabel:
        c.role === "field"
          ? "CRP"
          : c.role === "department"
            ? msg("विभाग")
            : msg(roleLabels[c.role as Role]),
      body: c.body,
      at: formatDate(c.created_at, true),
    })),
  }
}
