import { describe, expect, it } from "vitest"

import type { ApplicationDetail } from "@/api/types"

import { slaBanner } from "./applicationSla"

const base = {
  overdue: false,
  statusCode: "under_review",
  daysToSla: 4,
  slaDue: "09 नव. 2026",
  escalation: "",
  rejectionReason: null,
  delivery: null,
  sanction: null,
} as unknown as ApplicationDetail

describe("slaBanner", () => {
  it("counts down while open", () => {
    expect(slaBanner(base)).toEqual({
      tone: "due",
      icon: "clock",
      title: "स्वीकृति देय: 4 दिन",
      sub: "SLA अंतिम तिथि 09 नव. 2026",
    })
  })

  it("shows overdue days and the escalation level", () => {
    const banner = slaBanner({ ...base, overdue: true, daysToSla: -3, escalation: "कलेक्टर" })
    expect(banner.tone).toBe("overdue")
    expect(banner.title).toBe("अतिदेय 3 दिन – कलेक्टर स्तर एस्केलेशन")
  })

  it("explains closed applications", () => {
    expect(
      slaBanner({ ...base, statusCode: "rejected", rejectionReason: "दोहरा लाभ" }),
    ).toMatchObject({
      title: "आवेदन अस्वीकृत",
      sub: "दोहरा लाभ",
    })
    const delivered = {
      ...base,
      statusCode: "delivered",
      delivery: { date: "05 नव. 2026", asset: "जाल", lat: null, lng: null },
    }
    expect(slaBanner(delivered).title).toBe("डिलीवर • 05 नव. 2026")
    const sanctioned = {
      ...base,
      statusCode: "sanctioned",
      sanction: { orderNo: "F/1", date: "05 नव. 2026", amount: "₹40,800" },
    }
    expect(slaBanner(sanctioned)).toMatchObject({
      title: "स्वीकृत • आदेश सं. F/1",
      sub: "05 नव. 2026 • ₹40,800",
    })
  })
})
