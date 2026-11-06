import { describe, expect, it } from "vitest"

import { fitScale } from "./screenFit"

describe("fitScale", () => {
  it("keeps phones at full size", () => {
    expect(fitScale(390, 844)).toBe(1)
  })

  it("shrinks on small laptops, grows on big monitors, within limits", () => {
    expect(fitScale(1366, 768)).toBe(0.86)
    expect(fitScale(1520, 950)).toBe(1)
    expect(fitScale(1920, 1080)).toBe(1.1)
    expect(fitScale(1440, 900)).toBeCloseTo(0.947, 3)
  })
})
