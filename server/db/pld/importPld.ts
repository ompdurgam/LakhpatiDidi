// Imports the state's Potential Lakhpati Didi (PLD) list: one household per
// Didi, her SHG, and any panchayat / village that the LGD directory lacks.
// Safe to re-run: Didis are matched on their LokOS member code and SHGs on
// their LokOS code, so a newer list updates rows in place.
//
//   npm run pld:import -- "Potential Lakhpati Didi 2026-27.xlsx"
//
// Prerequisites: `npm run db:migrate` and `npm run geo:lgd`.
// Writes "<file> - new places.csv" listing the places it had to add.
import fs from "node:fs"
import path from "node:path"

import { csvLine } from "../geo/csv.ts"
import { pool, query } from "../pool.ts"
import { type HowMatched, placeKey, resolvePlaces } from "./resolvePlaces.ts"
import { readPldSheet } from "./sheet.ts"

const BATCH = 2000

async function inBatches<T>(items: T[], label: string, write: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += BATCH) {
    await write(items.slice(i, i + BATCH))
    const done = Math.min(i + BATCH, items.length)
    if (done % 50_000 < BATCH || done === items.length)
      console.log(`  ${label}: ${done}/${items.length}`)
  }
}

async function main() {
  if (!process.argv[2]) throw new Error('usage: npm run pld:import -- "<file>.xlsx"')
  const file = path.resolve(process.argv[2])
  console.log(`Reading ${path.basename(file)} …`)
  const { rows, skipped } = await readPldSheet(file)
  console.log(`${rows.length} Didis read, ${skipped.length} rows skipped`)
  for (const s of skipped.slice(0, 20)) console.log(`  row ${s.line}: ${s.reason}`)

  // 1. Geography — one transaction, so a failure adds no half-made places.
  const conn = await pool.getConnection()
  await conn.beginTransaction()
  const { places, how, created } = await resolvePlaces(conn, rows).catch(async (error) => {
    await conn.rollback()
    throw error
  })
  await conn.commit()
  conn.release()
  const byHow = new Map<HowMatched, number>()
  for (const r of rows)
    byHow.set(how.get(placeKey(r))!, (byHow.get(how.get(placeKey(r))!) ?? 0) + 1)
  console.log("Didis by place match:", Object.fromEntries(byHow))
  if (created.length) {
    const out = `${file.replace(/\.xlsx$/i, "")} - new places.csv`
    const lines = created.map((p) => csvLine([p.level, p.district, p.block, p.name]))
    fs.writeFileSync(out, [csvLine(["level", "district", "block", "name"]), ...lines].join("\n"))
    console.log(`${created.length} places added without an LGD code → ${out}`)
  }

  // 2. SHGs, keyed on their LokOS code (VO / CLF are not in the list).
  const shgs = new Map<string, [number, string, string]>()
  for (const r of rows) {
    if (r.shgCode && !shgs.has(r.shgCode))
      shgs.set(r.shgCode, [places.get(placeKey(r))!.villageId, r.shgCode, r.shgName])
  }
  await inBatches([...shgs.values()], "SHGs", (batch) =>
    pool.query(
      `INSERT INTO master_shgs (village_id, lokos_code, name) VALUES ?
       ON DUPLICATE KEY UPDATE village_id = VALUES(village_id), name = VALUES(name)`,
      [batch],
    ),
  )
  const shgIds = new Map(
    (
      await query<{ id: number; lokos_code: string }>(
        "SELECT id, lokos_code FROM master_shgs WHERE lokos_code IS NOT NULL",
      )
    ).map((s) => [s.lokos_code, s.id]),
  )

  // 3. Households: existing Didis keep their HH code; new ones continue the sequence.
  const existing = new Map(
    (
      await query<{ hh_code: string; lokos_member_code: string }>(
        "SELECT hh_code, lokos_member_code FROM tbl_households WHERE lokos_member_code IS NOT NULL",
      )
    ).map((h) => [h.lokos_member_code, h.hh_code]),
  )
  const [{ last }] = await query<{ last: number | null }>(
    "SELECT MAX(CAST(SUBSTRING_INDEX(hh_code, '-', -1) AS UNSIGNED)) AS last FROM tbl_households",
  )
  let seq = Number(last ?? 0)
  const households = rows.map((r) => {
    const place = places.get(placeKey(r))!
    const hhCode =
      existing.get(r.memberCode) ?? `HH-${place.hhPrefix}-${String(++seq).padStart(6, "0")}`
    return [
      hhCode,
      r.memberCode,
      r.name,
      r.name,
      r.guardian || null,
      place.villageId,
      shgIds.get(r.shgCode) ?? null,
      r.category,
    ]
  })
  await inBatches(households, "Didis", (batch) =>
    pool.query(
      `INSERT INTO tbl_households
         (hh_code, lokos_member_code, didi_name, didi_name_en, guardian_name, village_id, shg_id, social_category)
       VALUES ?
       ON DUPLICATE KEY UPDATE didi_name = VALUES(didi_name), didi_name_en = VALUES(didi_name_en),
         guardian_name = VALUES(guardian_name), village_id = VALUES(village_id),
         shg_id = VALUES(shg_id), social_category = VALUES(social_category), is_pld = 1`,
      [batch],
    ),
  )
  const added = rows.filter((r) => !existing.has(r.memberCode)).length
  console.log(`✓ ${households.length} Didis imported (${added} new), ${shgs.size} SHGs`)
  await pool.end()
}

main().catch(async (error) => {
  console.error("✗ PLD import failed:", error.sqlMessage ?? error.message)
  await pool.end()
  process.exit(1)
})
