// Imports area boundaries from a GeoJSON file, matched to the master tables
// by LGD code. Convert Shapefile/KML first, e.g. `npx mapshaper in.shp -o format=geojson out.json`.
//
//   npm run geo:boundaries -- --level village --file villages.geojson --code-field VILLAGE_LGD --source "CGSRLM 2026"
//
// Levels: state | district | block | gram_panchayat | village. Re-running replaces
// the boundaries of the codes in the file.
import fs from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"

import { pool, query, transaction } from "../pool.ts"
import { type Level, LEVELS, normaliseCode, prepareFeatures } from "./boundaries.ts"

const tableFor: Record<Exclude<Level, "state">, string> = {
  district: "master_districts",
  block: "master_blocks",
  gram_panchayat: "master_gram_panchayats",
  village: "master_villages",
}
const MAX_BATCH_BYTES = 500_000

async function main() {
  const { values } = parseArgs({
    options: {
      level: { type: "string" },
      file: { type: "string" },
      "code-field": { type: "string", default: "lgd_code" },
      source: { type: "string", default: "" },
    },
  })
  const level = values.level as Level
  if (!LEVELS.includes(level) || !values.file)
    throw new Error(
      `Usage: --level ${LEVELS.join("|")} --file <geojson> [--code-field X] [--source "…"]`,
    )
  const file = path.resolve(values.file)
  const { ready, skipped } = prepareFeatures(
    JSON.parse(fs.readFileSync(file, "utf8")),
    values["code-field"]!,
  )

  // Only keep codes that exist in the hierarchy (state uses its own code), and
  // store each under the hierarchy's own spelling of the code.
  const codes =
    level === "state"
      ? (await query<{ code: string }>("SELECT code FROM master_states")).map((r) => r.code)
      : (
          await query<{ lgd_code: string }>(
            `SELECT lgd_code FROM ${tableFor[level]} WHERE lgd_code IS NOT NULL`,
          )
        ).map((r) => r.lgd_code)
  const known = new Map(codes.map((c) => [normaliseCode(c), c]))
  const matched = ready
    .filter((f) => known.has(f.code))
    .map((f) => ({ ...f, code: known.get(f.code)! }))
  const unmatched = ready.filter((f) => !known.has(f.code))

  const source = values.source || path.basename(file)
  // Batch by size: XAMPP's MySQL default max_allowed_packet is 1 MB.
  const batches: unknown[][][] = [[]]
  let batchBytes = 0
  for (const f of matched) {
    const geometry = JSON.stringify(f.geometry)
    if (batchBytes + geometry.length > MAX_BATCH_BYTES && batches.at(-1)!.length) {
      batches.push([])
      batchBytes = 0
    }
    batches.at(-1)!.push([level, f.code, geometry, source])
    batchBytes += geometry.length
  }
  await transaction(async (db) => {
    for (const rows of batches.filter((b) => b.length)) {
      await db.query(
        `INSERT INTO master_boundaries (level, lgd_code, geometry, source) VALUES ?
         ON DUPLICATE KEY UPDATE geometry = VALUES(geometry), source = VALUES(source), imported_at = NOW()`,
        [rows],
      )
    }
  })

  console.log(`✓ ${matched.length} ${level} boundaries imported from ${path.basename(file)}`)
  if (unmatched.length)
    console.log(
      `· ${unmatched.length} codes not in the LGD hierarchy (run geo:lgd first?): ` +
        unmatched
          .slice(0, 10)
          .map((f) => f.code)
          .join(", "),
    )
  if (skipped.length)
    console.log(
      `· ${skipped.length} features skipped: ` +
        skipped
          .slice(0, 5)
          .map((s) => `#${s.index} ${s.reason}`)
          .join("; "),
    )
  await pool.end()
}

main().catch(async (error) => {
  console.error("✗ Boundary import failed:", error.sqlMessage ?? error.message)
  await pool.end()
  process.exit(1)
})
