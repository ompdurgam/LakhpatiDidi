import { describe, expect, it } from "vitest"

import { APPLICATION_AUDIENCE, isApplicationEvent } from "./notifications.applications.ts"
import {
  applicationLink,
  fill,
  isGoneStatus,
  nextRetryMinutes,
  type NotificationType,
  renderNotice,
  urgencyFor,
} from "./notifications.model.ts"

const sanctioned: NotificationType = {
  id: 1,
  code: "application.sanctioned",
  priority: "high",
  title_hi: "आवेदन {{code}} स्वीकृत",
  title_en: "Application {{code}} sanctioned",
  body_hi: "{{didi}} • {{scheme}} — {{amount}} स्वीकृत",
  body_en: "{{didi}} • {{scheme}} — {{amount}} sanctioned",
  push_enabled: 1,
  ttl_hours: 168,
}

const payload = {
  code: "APP-1",
  didi: "सुनीता कश्यप",
  didi_en: "Sunita Kashyap",
  scheme: "बैकयार्ड पोल्ट्री",
  scheme_en: "Backyard Poultry",
  amount: "₹36,000",
}

describe("notification templates", () => {
  it("renders the same stored notice in either language", () => {
    expect(renderNotice(sanctioned, payload, "hi")).toEqual({
      title: "आवेदन APP-1 स्वीकृत",
      body: "सुनीता कश्यप • बैकयार्ड पोल्ट्री — ₹36,000 स्वीकृत",
    })
    expect(renderNotice(sanctioned, payload, "en")).toEqual({
      title: "Application APP-1 sanctioned",
      body: "Sunita Kashyap • Backyard Poultry — ₹36,000 sanctioned",
    })
  })

  it("falls back to the Hindi value when there is no English one", () => {
    expect(fill("{{didi}}", { didi: "गीता", didi_en: null }, "en")).toBe("गीता")
  })

  it("leaves missing parameters empty and trims a dangling separator", () => {
    const type = { ...sanctioned, body_hi: "{{didi}} • {{note}}" }
    expect(renderNotice(type, { didi: "गीता" }, "hi").body).toBe("गीता")
  })
})

describe("notification links", () => {
  it("opens the right screen for each role", () => {
    expect(applicationLink("department", "APP-1", "FISH")).toBe("/dept/FISH/applications/APP-1")
    expect(applicationLink("block", "APP-1", "FISH")).toBe("/block/applications")
    expect(applicationLink("didi", "APP-1", "FISH")).toBe("/didi/applications")
  })
})

describe("push delivery rules", () => {
  it("backs off, then gives up", () => {
    expect([1, 2, 3, 4, 5].map(nextRetryMinutes)).toEqual([1, 5, 30, 120, 720])
    expect(nextRetryMinutes(6)).toBeNull()
  })

  it("drops a device only when the push service says it is gone", () => {
    expect(isGoneStatus(410)).toBe(true)
    expect(isGoneStatus(404)).toBe(true)
    expect(isGoneStatus(429)).toBe(false)
    expect(isGoneStatus(undefined)).toBe(false)
  })

  it("maps priority to the Web Push urgency header", () => {
    expect(urgencyFor("urgent")).toBe("high")
    expect(urgencyFor("normal")).toBe("normal")
    expect(urgencyFor("low")).toBe("low")
  })
})

describe("application audience", () => {
  it("covers every workflow event that writes a timeline entry", () => {
    for (const event of ["accepted", "info_requested", "sanctioned", "rejected", "delivered"])
      expect(isApplicationEvent(event)).toBe(true)
    expect(isApplicationEvent("dpr_submitted")).toBe(false)
  })

  it("tells the Didi about decisions on her application", () => {
    expect(APPLICATION_AUDIENCE.sanctioned).toContain("didi")
    expect(APPLICATION_AUDIENCE.info_requested).not.toContain("didi")
  })
})
