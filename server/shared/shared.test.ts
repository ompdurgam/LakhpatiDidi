import { describe, expect, it } from "vitest"
import { z } from "zod"

import { lifecycleFor } from "../modules/households/households.labels.ts"
import { HttpError } from "./errors.ts"
import { dateHi, financialYear, initials, inr, maskMobile } from "./format.ts"
import { codeList, mobile, parse, text } from "./validation.ts"

describe("format", () => {
  it("formats Hindi dates", () => {
    expect(dateHi("2026-11-05")).toBe("05 नव. 2026")
    expect(dateHi("2026-01-09 14:32:10", true)).toBe("09 जन. 2026 14:32")
    expect(dateHi(null)).toBe("")
  })

  it("formats rupees in Indian grouping", () => {
    expect(inr(120000)).toBe("₹1,20,000")
    expect(inr(null)).toBe("₹0")
  })

  it("derives initials and masks mobiles", () => {
    expect(initials("Sunita Kashyap", "सुनीता कश्यप")).toBe("SK")
    expect(initials(null, "अनिल कश्यप")).toBe("अक")
    expect(maskMobile("9826143412")).toBe("98•••••412")
  })

  it("labels the Indian financial year", () => {
    expect(financialYear(new Date(2026, 10, 5))).toBe("2026-27")
    expect(financialYear(new Date(2027, 1, 1))).toBe("2026-27")
    expect(financialYear(new Date(2027, 3, 1))).toBe("2027-28")
  })
})

describe("validation", () => {
  it("accepts and normalises mobile numbers", () => {
    expect(mobile.parse("98261-43412")).toBe("9826143412")
    expect(mobile.safeParse("1234567890").success).toBe(false)
  })

  it("turns the first issue into a 400 with its Hindi message", () => {
    const schema = z.object({ name: text("नाम") })
    expect(() => parse(schema, { name: "  " })).toThrow(HttpError)
    expect(() => parse(schema, {})).toThrow("नाम आवश्यक है")
    expect(parse(schema, { name: " सीता " })).toEqual({ name: "सीता" })
  })

  it("caps code lists and tolerates bad input", () => {
    expect(codeList(2).parse(["a", "b", "c"])).toEqual(["a", "b"])
    expect(codeList().parse("nope")).toEqual([])
  })
})

describe("household lifecycle", () => {
  it.each([
    [104000, 3, "lakhpati"],
    [62000, 1, "single_source"],
    [88000, 2, "threshold"],
    [45500, 2, "gap"],
    [72000, 2, "in_progress"],
  ] as const)("%i with %i sources → %s", (income, sources, status) => {
    expect(lifecycleFor(income, sources)).toBe(status)
  })
})
