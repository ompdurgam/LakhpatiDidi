import type { PoolConnection } from "mysql2/promise"

import { exec, one, transaction } from "../../db/pool.ts"
import { badRequest, notFound } from "../../shared/errors.ts"
import { financialYear } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row, SessionUser } from "../../shared/types.ts"
import { parse } from "../../shared/validation.ts"
import { categoryCode, lifecycleFor } from "../households/households.labels.ts"
import { areaOf } from "./surveyList.ts"
import { FIELD, householdFields, type IncomeEntry, surveyBody } from "./surveys.schemas.ts"

const net = (e: IncomeEntry) => e.gross - e.cost

/**
 * Next HH-<district LGD>-<block LGD>-###### code for a household in this village,
 * continuing the state-wide sequence used by the PLD import (locks the table).
 */
async function nextHouseholdCode(db: PoolConnection, villageId: number) {
  const place = await one<Row>(
    // LGD codes; places without one (not from the LGD import) use their master code.
    `SELECT COALESCE(d.lgd_code, d.code) AS district, COALESCE(b.lgd_code, b.code) AS block
     FROM master_villages v
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b           ON b.id  = gp.block_id
     JOIN master_districts d        ON d.id  = b.district_id
     WHERE v.id = ?`,
    [villageId],
    db,
  )
  const row = await one<Row>(
    `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(hh_code, '-', -1) AS UNSIGNED)), 0) + 1 AS next
     FROM tbl_households FOR UPDATE`,
    [],
    db,
  )
  return `HH-${place?.district}-${place?.block}-${String(row?.next ?? 1).padStart(6, "0")}`
}

/**
 * Saves a submitted survey. A Didi already on record (householdCode, e.g. from
 * the PLD list) or matched by mobile has her household updated; otherwise a
 * new household is created.
 */
export async function submitSurvey(body: unknown, user: SessionUser) {
  const surveyorId = user.id
  const area = await areaOf(user)
  const { householdCode, responses, incomeEntries, sections, consentMethod } = parse(
    surveyBody,
    body,
  )
  const fields = parse(householdFields, responses)
  const name = fields[FIELD.name]
  const mobile = fields[FIELD.mobile] ?? null
  const villageName = fields[FIELD.village]
  const category: string | undefined = categoryCode[fields[FIELD.category] ?? ""]

  const active = incomeEntries.filter((e) => net(e) > 0)
  const income = active.reduce((sum, e) => sum + net(e), 0)
  const status = lifecycleFor(income, active.length)

  return transaction(async (db) => {
    const onRecord = householdCode
      ? await one<Row>(
          "SELECT id, hh_code, village_id FROM tbl_households WHERE hh_code = ? FOR UPDATE",
          [householdCode],
          db,
        )
      : undefined
    if (householdCode && !onRecord) throw notFound(msg("परिवार नहीं मिला"))
    if (!onRecord && !villageName) throw badRequest(msg("गाँव चुनें"))
    // A Didi on record stays in her village; a new one is placed in the village chosen,
    // looked up inside the surveyor's own areas (village names repeat across the state).
    const village = onRecord
      ? await one<Row>(
          "SELECT id, name_hi FROM master_villages WHERE id = ?",
          [onRecord.village_id],
          db,
        )
      : await one<Row>(
          `SELECT v.id, v.name_hi
           FROM master_villages v
           JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
           JOIN master_blocks b           ON b.id  = gp.block_id
           WHERE (v.name_hi = ? OR v.name_en = ?) AND ${area.sql}
           LIMIT 1`,
          [villageName, villageName, ...area.params],
          db,
        )
    if (!village)
      throw badRequest(
        msg('गाँव "{{village}}" भूगोल मास्टर में नहीं है', { village: villageName ?? "" }),
      )
    // SHG names repeat across the state, so only an SHG of her village counts.
    const shg = await one<Row>(
      "SELECT id FROM master_shgs WHERE name = ? AND village_id = ?",
      [fields[FIELD.shg] ?? null, village.id],
      db,
    )
    const existing =
      onRecord ??
      (mobile
        ? await one<Row>(
            "SELECT id, hh_code FROM tbl_households WHERE mobile = ? FOR UPDATE",
            [mobile],
            db,
          )
        : undefined)

    let householdId: number
    let hhCode: string
    const common = [name, fields[FIELD.guardian] ?? null, fields[FIELD.age] ?? null, village.id]
    if (existing) {
      householdId = existing.id
      hhCode = existing.hh_code
      await exec(
        `UPDATE tbl_households SET didi_name = ?, guardian_name = ?, age = ?, village_id = ?,
           mobile = COALESCE(?, mobile), shg_id = COALESCE(?, shg_id),
           social_category = COALESCE(?, social_category), current_annual_income = ?,
           active_income_sources = ?, lifecycle_status = ?, surveyed_by = ?, surveyed_at = NOW()
         WHERE id = ?`,
        [
          ...common,
          mobile,
          shg?.id ?? null,
          category ?? null,
          income,
          active.length,
          status,
          surveyorId,
          householdId,
        ],
        db,
      )
    } else {
      hhCode = await nextHouseholdCode(db, village.id)
      const insert = await exec(
        `INSERT INTO tbl_households (hh_code, didi_name, guardian_name, age, village_id, mobile, shg_id,
           social_category, current_annual_income, active_income_sources, lifecycle_status, surveyed_by, surveyed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          hhCode,
          ...common,
          mobile,
          shg?.id ?? null,
          category ?? "ST",
          income,
          active.length,
          status,
          surveyorId,
        ],
        db,
      )
      householdId = insert.insertId
    }

    // A surveyed Didi can sign in with her own number (never overrides a staff number).
    if (mobile) {
      await exec(
        `INSERT IGNORE INTO master_users (name, mobile, role, designation, village_id)
         VALUES (?, ?, 'didi', 'Didi (PLD)', ?)`,
        [name, mobile, village.id],
        db,
      )
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
