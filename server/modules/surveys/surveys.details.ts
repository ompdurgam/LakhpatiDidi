// Turns a submitted survey's answers into the structured rows dashboards,
// trackers and recommendations read: income sources, loans, entitlement gaps
// and the PLD flag. The full answers are also kept as JSON in tbl_surveys.
import type { PoolConnection } from "mysql2/promise"

import { type Db, exec, query } from "../../db/pool.ts"
import type { Row } from "../../shared/types.ts"
import type { IncomeEntry } from "./surveys.schemas.ts"

/** Survey answer keys (field labels; section D answers are "D • <scheme> • <label>"). */
const LOANS_KEY = "ऋण विवरण"
const PLD_KEY = "क्या संभावित लखपति दीदी (PLD) हैं?"
const SCHEME_STATUS = /^D • (.+) • स्थिति$/
/** Section D names that differ from the scheme master's Hindi name. */
const SCHEME_ALIAS: Record<string, string> = { मुद्रा: "मुद्रा ऋण" }

/** Loan source on the survey → tbl_household_loans.lender_type. */
const LENDER: Record<string, string> = {
  "SHG/VO/CLF (CIF/CEF)": "shg",
  "बैंक/PACS": "bank",
  "MFI/NBFC": "mfi",
  "साहूकार/अनौपचारिक": "moneylender",
}

type Loan = {
  source: string
  taken: string
  purpose: string
  principal: number
  outstanding: number
  rate: number
}

const json = <T>(raw: string | undefined, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const amount = (n: unknown) => Math.max(0, Number(n) || 0)

export async function saveSurveyDetails(
  db: PoolConnection,
  householdId: number,
  surveyId: number,
  financialYear: string,
  incomeEntries: IncomeEntry[],
  responses: Record<string, string>,
) {
  await saveIncomeSources(db, householdId, surveyId, financialYear, incomeEntries)
  await saveLoans(db, householdId, json<Loan[]>(responses[LOANS_KEY], []))
  await saveEntitlementGaps(db, householdId, responses)
  const pld = responses[PLD_KEY]
  if (pld === "हाँ" || pld === "नहीं")
    await exec(
      "UPDATE tbl_households SET is_pld = ? WHERE id = ?",
      [pld === "हाँ" ? 1 : 0, householdId],
      db,
    )
}

/** This year's sources with any income or cost; sources no longer reported are removed. */
async function saveIncomeSources(
  db: PoolConnection,
  householdId: number,
  surveyId: number,
  fy: string,
  entries: IncomeEntry[],
) {
  const reported = entries.filter((e) => e.gross > 0 || e.cost > 0)
  await exec(
    `DELETE FROM tbl_household_income_sources
     WHERE household_id = ? AND financial_year = ? ${reported.length ? "AND source_name NOT IN (?)" : ""}`,
    reported.length ? [householdId, fy, reported.map((e) => e.name)] : [householdId, fy],
    db,
  )
  for (const e of reported)
    await exec(
      `INSERT INTO tbl_household_income_sources
         (household_id, survey_id, source_name, months_active, gross_income, cost, financial_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE survey_id = VALUES(survey_id), months_active = VALUES(months_active),
         gross_income = VALUES(gross_income), cost = VALUES(cost)`,
      [householdId, surveyId, e.name, e.months.join(","), amount(e.gross), amount(e.cost), fy],
      db,
    )
}

/** The household's loans as of this survey (replaces the previous survey's). */
async function saveLoans(db: PoolConnection, householdId: number, loans: Loan[]) {
  await exec("DELETE FROM tbl_household_loans WHERE household_id = ?", [householdId], db)
  for (const loan of loans.filter((l) => l.taken === "हाँ" && amount(l.principal) > 0))
    await exec(
      `INSERT INTO tbl_household_loans
         (household_id, lender_type, principal, interest_rate_pa, outstanding, purpose)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        householdId,
        LENDER[loan.source] ?? "other",
        amount(loan.principal),
        Math.min(999, amount(loan.rate)),
        amount(loan.outstanding),
        String(loan.purpose ?? "").slice(0, 150) || null,
      ],
      db,
    )
}

/**
 * Section D: a scheme the household is not receiving ("आवेदन नहीं" / "आवेदन लंबित")
 * opens an entitlement gap; "प्राप्त" closes it. Schemes are matched to master_schemes
 * by Hindi name (migration 017 adds every section D entitlement).
 */
export async function saveEntitlementGaps(
  db: Db,
  householdId: number,
  responses: Record<string, string>,
) {
  const answers = Object.entries(responses).flatMap(([key, status]) => {
    const match = SCHEME_STATUS.exec(key)
    return match && status ? [{ scheme: SCHEME_ALIAS[match[1]] ?? match[1], status }] : []
  })
  if (!answers.length) return
  const schemes = await query<Row>(
    "SELECT id, name_hi FROM master_schemes WHERE name_hi IN (?)",
    [answers.map((a) => a.scheme)],
    db,
  )
  const idOf = new Map(schemes.map((s) => [s.name_hi as string, s.id as number]))
  for (const { scheme, status } of answers) {
    const schemeId = idOf.get(scheme)
    if (!schemeId) continue
    if (status === "प्राप्त")
      await exec(
        `UPDATE tbl_entitlement_gaps SET status = 'closed', closed_on = CURDATE()
         WHERE household_id = ? AND scheme_id = ? AND status = 'open'`,
        [householdId, schemeId],
        db,
      )
    else
      await exec(
        `INSERT INTO tbl_entitlement_gaps (household_id, scheme_id, status, identified_on)
         VALUES (?, ?, 'open', CURDATE())
         ON DUPLICATE KEY UPDATE
           identified_on = IF(status = 'open', identified_on, CURDATE()),
           status = 'open', closed_on = NULL`,
        [householdId, schemeId],
        db,
      )
  }
}
