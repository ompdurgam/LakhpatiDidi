import { describe, expect, it } from "vitest"

import type { Row } from "../../shared/types.ts"
import { buildTimeline, toApplicationRow } from "./applications.mapper.ts"
import { actions, assertAllowed, isActionName } from "./applications.workflow.ts"

const row = (fields: Record<string, unknown>) => fields as Row

describe("applications workflow", () => {
  it("knows its actions", () => {
    expect(isActionName("sanction")).toBe(true)
    expect(isActionName("approve")).toBe(false)
    expect(isActionName(undefined)).toBe(false)
  })

  it("allows sanction only while open", () => {
    expect(() => assertAllowed("sanction", "under_review")).not.toThrow()
    expect(() => assertAllowed("sanction", "rejected")).toThrow(/अस्वीकृत/)
  })

  it("requires a sanction before delivery", () => {
    expect(() => assertAllowed("deliver", "sanctioned")).not.toThrow()
    expect(() => assertAllowed("deliver", "under_review")).toThrow(
      "डिलीवरी से पहले आवेदन स्वीकृत होना चाहिए",
    )
  })

  it("lets block staff follow up in any status", () => {
    expect(() => assertAllowed("follow_up", "delivered")).not.toThrow()
  })

  it("validates sanction input", () => {
    const schema = actions.sanction.schema
    expect(schema.safeParse({ orderNo: "F/1", date: "2026-11-05", amount: "40,800" }).data).toEqual(
      {
        orderNo: "F/1",
        date: "2026-11-05",
        amount: 40800,
      },
    )
    expect(schema.safeParse({ orderNo: "", date: "2026-11-05", amount: 1 }).success).toBe(false)
    expect(schema.safeParse({ orderNo: "F/1", date: "05-11-2026", amount: 1 }).success).toBe(false)
    expect(schema.safeParse({ orderNo: "F/1", date: "2026-11-05", amount: 0 }).success).toBe(false)
  })
})

describe("applications mapper", () => {
  it("shows overdue instead of the stored status", () => {
    const mapped = toApplicationRow(
      row({
        app_code: "APP-1",
        didi_name: "सीता नाग",
        didi_name_en: "Sita Nag",
        status: "under_review",
        is_overdue: 1,
        days_pending: 18,
        project_cost: 120000,
        subsidy_amount: 72000,
        received_on: "2026-10-18",
      }),
    )
    expect(mapped).toMatchObject({
      status: "अतिदेय",
      statusCode: "under_review",
      initials: "SN",
      amount: "₹1,20,000",
      received: "18 अक्टू. 2026",
    })
  })

  it("builds the timeline with the first pending step active", () => {
    const steps = buildTimeline(row({ status: "under_review" }), [
      row({ event_type: "dpr_submitted", created_at: "2026-11-01 10:00:00" }),
      row({ event_type: "blcc_action", created_at: "2026-11-02 10:00:00" }),
    ])
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "active", "", "", ""])
  })

  it("shows a rejected application without an active step", () => {
    const steps = buildTimeline(row({ status: "rejected" }), [
      row({ event_type: "dpr_submitted", created_at: "2026-11-01 10:00:00" }),
      row({ event_type: "rejected", created_at: "2026-11-03 10:00:00" }),
    ])
    expect(steps[3]).toMatchObject({ label: "अस्वीकृत", state: "done" })
    expect(steps.some((s) => s.state === "active")).toBe(false)
  })
})
