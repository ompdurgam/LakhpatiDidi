// Presentation helpers shared by the API modules (Hindi dates, ₹, initials).
import crypto from "node:crypto"

import { requestLang } from "./i18n.ts"

const monthsHi = [
  "जन.",
  "फ़र.",
  "मार्च",
  "अप्रै.",
  "मई",
  "जून",
  "जुला.",
  "अग.",
  "सित.",
  "अक्टू.",
  "नव.",
  "दिस.",
]

const monthsEn = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function formatWith(months: string[], value: string | null | undefined, withTime: boolean) {
  if (!value) return ""
  const [date, time = ""] = value.split(" ")
  const [y, m, d] = date.split("-")
  const base = `${d} ${months[Number(m) - 1]} ${y}`
  return withTime && time ? `${base} ${time.slice(0, 5)}` : base
}

/** "2026-11-05" or "2026-11-05 14:32:00" → "05 नव. 2026" (optionally with time). */
export const dateHi = (value: string | null | undefined, withTime = false) =>
  formatWith(monthsHi, value, withTime)

/** Like dateHi, but "05 Nov 2026" when the request is in English. */
export const formatDate = (value: string | null | undefined, withTime = false) =>
  formatWith(requestLang() === "en" ? monthsEn : monthsHi, value, withTime)

export function inr(amount: number | null | undefined) {
  return `₹${Math.round(Number(amount ?? 0)).toLocaleString("en-IN")}`
}

export function initials(nameEn: string | null, nameHi: string) {
  return (nameEn || nameHi)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase()
}

export const maskMobile = (mobile: string) => `${mobile.slice(0, 2)}•••••${mobile.slice(-3)}`

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex")

/** Today as YYYY-MM-DD. */
export const today = () => new Date().toISOString().slice(0, 10)

/** Current time in IST as "YYYY-MM-DD HH:MM". */
export const nowIst = () =>
  new Date(Date.now() + 5.5 * 3600_000).toISOString().replace("T", " ").slice(0, 16)

/** Indian financial year label for a date, e.g. "2026-27". */
export function financialYear(date = new Date()) {
  const year = date.getFullYear()
  return date.getMonth() >= 3
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`
}
