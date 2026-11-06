import { useTranslation } from "react-i18next"

import i18n from "./index"

/**
 * Source-text translation for the feature screens.
 *
 * Hindi is the source language: screens write `tr("हिंदी पाठ")` and the
 * English comes from `src/i18n/en/*.json` (Hindi text → English). Keeping
 * the Hindi text as the key means values that double as data (statuses,
 * survey options, income-source names sent to the API) stay stable across
 * languages — only what is displayed changes.
 *
 * `{{name}}` placeholders are filled from `vars` in both languages.
 * `src/i18n/tr.test.ts` fails when a `tr("…")` literal has no English entry.
 */
const dictionary: Record<string, string> = Object.assign(
  {},
  ...Object.values(
    import.meta.glob<Record<string, string>>("./en/*.json", { eager: true, import: "default" }),
  ),
)

export type Vars = Record<string, string | number>

function fill(text: string, vars?: Vars) {
  if (!vars) return text
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

// Month abbreviations the API uses in dates ("05 नव. 2026") and their English forms.
const months: [string, string][] = [
  ["जन.", "Jan"],
  ["फ़र.", "Feb"],
  ["मार्च", "Mar"],
  ["अप्रै.", "Apr"],
  ["मई", "May"],
  ["जून", "Jun"],
  ["जुला.", "Jul"],
  ["अग.", "Aug"],
  ["सित.", "Sep"],
  ["अक्टू.", "Oct"],
  ["नव.", "Nov"],
  ["दिस.", "Dec"],
]
const hindiDate = new RegExp(
  `(\\d{1,2}) (${months.map(([hi]) => hi.replace(".", "\\.")).join("|")})(?= \\d{4})`,
  "g",
)

/** "05 नव. 2026 14:32" → "05 Nov 2026 14:32" (dates as the API formats them). */
const englishDates = (text: string) =>
  text.replace(hindiDate, (_, day: string, month: string) => {
    const en = months.find(([hi]) => hi === month)?.[1] ?? month
    return `${day} ${en}`
  })

/** Translate Hindi source text into the active language. */
export function translate(hindi: string, vars?: Vars) {
  const text = i18n.language === "en" ? (dictionary[hindi] ?? englishDates(hindi)) : hindi
  return fill(text, vars)
}

/** Translate a list of Hindi strings (e.g. option labels). */
export const translateAll = (items: readonly string[]) => items.map((item) => translate(item))

/** `tr` for components; re-renders the component when the language changes. */
export function useTr() {
  useTranslation()
  return translate
}

/** True when the English dictionary has an entry (used by the coverage test). */
export const hasEnglish = (hindi: string) => hindi in dictionary
