import { describe, expect, it } from "vitest"

import { timeAgo } from "./timeAgo"

const now = new Date("2026-11-07T12:00:00+05:30").getTime()

describe("timeAgo", () => {
  it("reads naturally in both languages", () => {
    expect(timeAgo("2026-11-07T11:55:00+05:30", "en", now)).toBe("5 minutes ago")
    expect(timeAgo("2026-11-06T12:00:00+05:30", "en", now)).toBe("yesterday")
    expect(timeAgo("2026-11-07T11:55:00+05:30", "hi", now)).toMatch(/5 मिनट पहले/)
  })

  it("says now for the last minute", () => {
    expect(timeAgo("2026-11-07T11:59:40+05:30", "en", now)).toBe("now")
  })
})
