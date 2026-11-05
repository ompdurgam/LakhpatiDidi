import type { PoolConnection } from "mysql2/promise"

import { exec, one, transaction } from "../../db/pool.ts"
import { badRequest } from "../../shared/errors.ts"
import { financialYear } from "../../shared/format.ts"
import type { Row } from "../../shared/types.ts"
import { parse } from "../../shared/validation.ts"
import { categoryCode, lifecycleFor } from "../households/households.labels.ts"
import { FIELD, householdFields, type IncomeEntry, surveyBody } from "./surveys.schemas.ts"

const net = (e: IncomeEntry) => e.gross - e.cost

/** Next HH-BST-JGD-###### code (locks the table for the transaction). */
async function nextHouseholdCode(db: PoolConnection) {
  const row = await one<Row>(
    `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(hh_code, '-', -1) AS UNSIGNED)), 0) + 1 AS next
     FROM tbl_households FOR UPDATE`,
    [],
    db,
  )
  return `HH-BST-JGD-${String(row?.next ?? 1).padStart(6, "0")}`
}

/**
 * Saves a submitted survey. The Didi is matched by mobile: a re-survey
 * updates her household, otherwise a new household is created.
 */
export async function submitSurvey(body: unknown, surveyorId: number) {
  const { responses, incomeEntries, sections, consentMethod } = parse(surveyBody, body)
  const fields = parse(householdFields, responses)
  const name = fields[FIELD.name]
  const mobile = fields[FIELD.mobile] ?? null
  const villageName = fields[FIELD.village]
  const category = categoryCode[fields[FIELD.category] ?? ""] ?? "ST"

  const active = incomeEntries.filter((e) => net(e) > 0)
  const income = active.reduce((sum, e) => sum + net(e), 0)
  const status = lifecycleFor(income, active.length)

  return transaction(async (db) => {
    const village = await one<Row>(
      "SELECT id, name_hi FROM master_villages WHERE name_hi = ?",
      [villageName],
      db,
    )
    if (!village) throw badRequest(`गाँव "${villageName}" भूगोल मास्टर में नहीं है`)
    const shg = await one<Row>(
      "SELECT id FROM master_shgs WHERE name = ?",
      [fields[FIELD.shg] ?? null],
      db,
    )
    const existing = mobile
      ? await one<Row>(
          "SELECT id, hh_code FROM tbl_households WHERE mobile = ? FOR UPDATE",
          [mobile],
          db,
        )
      : undefined

    let householdId: number
    let hhCode: string
    const common = [name, fields[FIELD.guardian] ?? null, fields[FIELD.age] ?? null, village.id]
    if (existing) {
      householdId = existing.id
      hhCode = existing.hh_code
      await exec(
        `UPDATE tbl_households SET didi_name = ?, guardian_name = ?, age = ?, village_id = ?,
           shg_id = COALESCE(?, shg_id), current_annual_income = ?, active_income_sources = ?,
           lifecycle_status = ?, surveyed_by = ?, surveyed_at = NOW()
         WHERE id = ?`,
        [...common, shg?.id ?? null, income, active.length, status, surveyorId, householdId],
        db,
      )
    } else {
      hhCode = await nextHouseholdCode(db)
      const insert = await exec(
        `INSERT INTO tbl_households (hh_code, didi_name, guardian_name, age, village_id, mobile, shg_id,
           social_category, current_annual_income, active_income_sources, lifecycle_status, surveyed_by, surveyed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          hhCode,
          ...common,
          mobile,
          shg?.id ?? null,
          category,
          income,
          active.length,
          status,
          surveyorId,
        ],
        db,
      )
      householdId = insert.insertId
    }

    const survey = await exec(
      `INSERT INTO tbl_surveys (household_id, surveyor_id, status, enabled_sections, responses, consent_method, submitted_at)
       VALUES (?, ?, 'submitted', ?, ?, ?, NOW())`,
      [householdId, surveyorId, sections, JSON.stringify(responses), consentMethod],
      db,
    )
    const fy = financialYear()
    for (const e of incomeEntries) {
      await exec(
        `INSERT INTO tbl_household_income_sources
           (household_id, survey_id, source_name, months_active, gross_income, cost, financial_year)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE survey_id = VALUES(survey_id), months_active = VALUES(months_active),
           gross_income = VALUES(gross_income), cost = VALUES(cost)`,
        [householdId, survey.insertId, e.name, e.months.join(","), e.gross, e.cost, fy],
        db,
      )
    }
    return { hhCode, name, village: village.name_hi as string, created: !existing }
  })
}
