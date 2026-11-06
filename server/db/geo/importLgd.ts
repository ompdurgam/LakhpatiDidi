// Imports the Chhattisgarh LGD hierarchy (district → block → GP → village)
// into the master tables. Safe to re-run: rows are matched by LGD code, and
// existing rows without one (the Hindi demo data) are linked by name.
//
//   npm run geo:lgd                       (default file)
//   npm run geo:lgd -- path/to/file.csv
import type { PoolConnection } from "mysql2/promise"
import fs from "node:fs"
import path from "node:path"

import { pool, query, transaction } from "../pool.ts"
import { buildHierarchy, districtHindi, type LgdArea, type LgdRow, parseCsv } from "./lgd.ts"

type Row = { id: number; lgd_code: string | null; name_en: string; parent_id: number }

const DEFAULT_FILE = path.resolve(
  import.meta.dirname,
  "../../../database/data/lgd/chhattisgarh-villages.csv",
)
const BATCH = 1000
const key = (parentId: number, name: string) => `${parentId}|${name.toLowerCase()}`

/** Links or inserts one level; returns LGD code → row id. */
async function upsertLevel(
  db: PoolConnection,
  opts: {
    table: string
    parentColumn: string
    codePrefix: string
    areas: (LgdArea & { type?: string })[]
    parentIds: Map<string, number>
    hindi?: (name: string) => string
  },
) {
  const { table, parentColumn, codePrefix, areas, parentIds } = opts
  const existing = await query<Row>(
    `SELECT id, lgd_code, name_en, ${parentColumn} AS parent_id FROM ${table}`,
    [],
    db,
  )
  const byLgd = new Map(existing.filter((r) => r.lgd_code).map((r) => [r.lgd_code!, r.id]))
  const byName = new Map(
    existing.filter((r) => !r.lgd_code).map((r) => [key(r.parent_id, r.name_en), r.id]),
  )
  const ids = new Map<string, number>()
  const inserts: unknown[][] = []
  let linked = 0

  for (const area of areas) {
    const parentId = parentIds.get(area.parent)
    if (parentId === undefined) continue
    const found = byLgd.get(area.code) ?? byName.get(key(parentId, area.name))
    if (found !== undefined) {
      if (!byLgd.has(area.code)) {
        await db.query(`UPDATE ${table} SET lgd_code = ? WHERE id = ?`, [area.code, found])
        linked++
      }
      ids.set(area.code, found)
      continue
    }
    const hindi = opts.hindi?.(area.name) ?? area.name
    const row = [parentId, `${codePrefix}${area.code}`, area.code, hindi, area.name]
    inserts.push(table === "master_gram_panchayats" ? [...row, area.type ?? null] : row)
  }

  const columns = [parentColumn, "code", "lgd_code", "name_hi", "name_en"]
  if (table === "master_gram_panchayats") columns.push("local_body_type")
  for (let i = 0; i < inserts.length; i += BATCH) {
    await db.query(`INSERT INTO ${table} (${columns.join(", ")}) VALUES ?`, [
      inserts.slice(i, i + BATCH),
    ])
  }
  const rows = await query<{ id: number; lgd_code: string }>(
    `SELECT id, lgd_code FROM ${table} WHERE lgd_code IS NOT NULL`,
    [],
    db,
  )
  for (const r of rows) ids.set(r.lgd_code, r.id)
  console.log(`${table}: ${inserts.length} added, ${linked} linked, ${ids.size} with LGD code`)
  return ids
}

/** Demo villages (no LGD code) whose name matches an LGD village in the same block. */
async function linkDemoVillages(
  db: PoolConnection,
  villages: LgdArea[],
  gpIds: Map<string, number>,
) {
  const demo = await query<{ id: number; name_en: string; block_id: number }>(
    `SELECT v.id, v.name_en, gp.block_id FROM master_villages v
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id WHERE v.lgd_code IS NULL`,
    [],
    db,
  )
  if (!demo.length) return
  const gpBlock = new Map(
    (
      await query<{ id: number; block_id: number }>(
        "SELECT id, block_id FROM master_gram_panchayats",
        [],
        db,
      )
    ).map((r) => [r.id, r.block_id]),
  )
  for (const v of demo) {
    const matches = villages.filter((lgd) => {
      const gpId = gpIds.get(lgd.parent)
      return (
        gpId &&
        gpBlock.get(gpId) === v.block_id &&
        lgd.name.toLowerCase() === v.name_en.toLowerCase()
      )
    })
    if (matches.length !== 1) continue
    await db.query("UPDATE master_villages SET lgd_code = ?, gram_panchayat_id = ? WHERE id = ?", [
      matches[0].code,
      gpIds.get(matches[0].parent),
      v.id,
    ])
    console.log(`linked demo village ${v.name_en} → LGD ${matches[0].code}`)
  }
}

async function main() {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_FILE
  const rows = parseCsv(fs.readFileSync(file, "utf8")) as LgdRow[]
  const tree = buildHierarchy(rows)
  console.log(
    `LGD file: ${tree.districts.length} districts, ${tree.blocks.length} blocks, ` +
      `${tree.panchayats.length} local bodies, ${tree.villages.length} villages`,
  )

  await transaction(async (db) => {
    const state = await query<{ id: number }>(
      "SELECT id FROM master_states WHERE code = 'CG'",
      [],
      db,
    )
    if (!state.length) throw new Error("State CG missing — run the seeds first")
    const districtIds = await upsertLevel(db, {
      table: "master_districts",
      parentColumn: "state_id",
      codePrefix: "D",
      areas: tree.districts,
      parentIds: new Map([["CG", state[0].id]]),
      hindi: (name) => districtHindi[name] ?? name,
    })
    const blockIds = await upsertLevel(db, {
      table: "master_blocks",
      parentColumn: "district_id",
      codePrefix: "B",
      areas: tree.blocks,
      parentIds: districtIds,
    })
    const gpIds = await upsertLevel(db, {
      table: "master_gram_panchayats",
      parentColumn: "block_id",
      codePrefix: "GP",
      areas: tree.panchayats,
      parentIds: blockIds,
    })
    await linkDemoVillages(db, tree.villages, gpIds)
    await upsertLevel(db, {
      table: "master_villages",
      parentColumn: "gram_panchayat_id",
      codePrefix: "V",
      areas: tree.villages,
      parentIds: gpIds,
    })
  })
  await pool.end()
}

main().catch(async (error) => {
  console.error("✗ LGD import failed:", error.sqlMessage ?? error.message)
  await pool.end()
  process.exit(1)
})
