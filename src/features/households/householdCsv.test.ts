import { describe, expect, it } from "vitest"

import { householdFixture } from "@/test/fixtures"

import { householdsToCsv } from "./householdCsv"

describe("householdsToCsv", () => {
  it("writes a quoted header and one line per household", () => {
    const lines = householdsToCsv([householdFixture]).split("\n")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(
      '"HH ID","दीदी","गाँव","SHG","VO","CLF","वर्ग","आय","स्रोत","खुले आवेदन","गैप","स्थिति"',
    )
    expect(lines[1]).toContain('"HH-BST-JGD-000123","सुनीता कश्यप"')
    expect(lines[1]).toContain('"78500"')
  })

  it("escapes quotes inside values", () => {
    const csv = householdsToCsv([{ ...householdFixture, name: 'सीता "दीदी"' }])
    expect(csv).toContain('"सीता ""दीदी"""')
  })
})
