import type { HouseholdRow } from "@/api/types"
import { translate as tr } from "@/i18n/tr"

const columns: [string, (r: HouseholdRow) => string | number][] = [
  ["HH ID", (r) => r.id],
  ["दीदी", (r) => r.name],
  ["गाँव", (r) => r.village],
  ["SHG", (r) => r.shg],
  ["VO", (r) => r.vo],
  ["CLF", (r) => r.clf],
  ["वर्ग", (r) => r.category],
  ["आय", (r) => r.income],
  ["स्रोत", (r) => r.sources],
  ["खुले आवेदन", (r) => r.applications],
  ["गैप", (r) => r.gaps],
  ["स्थिति", (r) => r.status],
]

const quote = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`

/** CSV text (quoted, comma-separated) for the household register; headers follow the UI language. */
export function householdsToCsv(rows: HouseholdRow[]) {
  return [
    columns.map(([header]) => tr(header)),
    ...rows.map((r) => columns.map(([, get]) => get(r))),
  ]
    .map((line) => line.map(quote).join(","))
    .join("\n")
}

/** Downloads the CSV; the BOM makes Excel read the Hindi text as UTF-8. */
export function downloadHouseholdsCsv(rows: HouseholdRow[]) {
  const link = document.createElement("a")
  link.href = URL.createObjectURL(
    new Blob(["﻿" + householdsToCsv(rows)], { type: "text/csv;charset=utf-8" }),
  )
  link.download = `households-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
