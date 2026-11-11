// Reads the state's Potential Lakhpati Didi workbook (first sheet, one Didi per
// row) as a stream, so the 6 lakh+ row file never sits in memory as XML.
import ExcelJS from "exceljs"

import { socialCategory } from "./places.ts"

export type PldRow = {
  district: string
  block: string
  panchayat: string
  village: string
  name: string
  memberCode: string
  shgName: string
  shgCode: string
  guardian: string
  category: ReturnType<typeof socialCategory>
}

/** Header text in the workbook → field. */
const HEADERS: Record<string, keyof PldRow> = {
  District: "district",
  Block: "block",
  "Panchayat Name": "panchayat",
  "Village Name": "village",
  "Potential Lakhpati Didi Name": "name",
  "Potential Lakhpati Didi Code": "memberCode",
  "SHG Name": "shgName",
  "SHG Code": "shgCode",
  "Father / Spouse Name": "guardian",
  "Social Category": "category",
}

const text = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()

const code = (value: unknown) => {
  const s = text(value)
  return /^\d{6,20}$/.test(s) ? s : ""
}

/** Builds one row; returns the reason when it cannot be imported. */
export function toPldRow(raw: Record<keyof PldRow, unknown>): PldRow | string {
  const row: PldRow = {
    district: text(raw.district),
    block: text(raw.block),
    panchayat: text(raw.panchayat),
    village: text(raw.village),
    name: text(raw.name).slice(0, 120),
    memberCode: code(raw.memberCode),
    shgName: text(raw.shgName).slice(0, 150),
    shgCode: code(raw.shgCode),
    guardian: text(raw.guardian).slice(0, 120),
    category: socialCategory(text(raw.category)),
  }
  if (!row.memberCode) return `invalid PLD code "${text(raw.memberCode)}"`
  if (!row.name) return "missing name"
  if (!row.district || !row.block || !row.panchayat || !row.village) return "missing place"
  return row
}

export async function readPldSheet(file: string) {
  const rows: PldRow[] = []
  const skipped: { line: number; reason: string }[] = []
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(file, {
    sharedStrings: "cache",
    worksheets: "emit",
    hyperlinks: "ignore",
    styles: "ignore",
  })
  for await (const sheet of reader) {
    let columns: Map<number, keyof PldRow> | undefined
    for await (const row of sheet) {
      const values = row.values as unknown[]
      if (!columns) {
        const found = new Map<number, keyof PldRow>()
        values.forEach((v, i) => HEADERS[text(v)] && found.set(i, HEADERS[text(v)]))
        columns = found
        const missing = Object.keys(HEADERS).filter(
          (h) => ![...found.values()].includes(HEADERS[h]),
        )
        if (missing.length) throw new Error(`missing columns: ${missing.join(", ")}`)
        continue
      }
      if (!values.some((v) => text(v))) continue
      const raw = {} as Record<keyof PldRow, unknown>
      for (const [i, field] of columns) raw[field] = values[i]
      const parsed = toPldRow(raw)
      if (typeof parsed === "string") skipped.push({ line: row.number, reason: parsed })
      else rows.push(parsed)
    }
    break // first sheet only
  }
  return { rows, skipped }
}
