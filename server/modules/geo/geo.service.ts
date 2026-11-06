import { one, query } from "../../db/pool.ts"
import { notFound } from "../../shared/errors.ts"
import { msg, requestLang } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { childOf, type GeoLevel, levels, parentOf } from "./geo.levels.ts"

// Households joined up to the state, so any level can be rolled up.
const HOUSEHOLD_JOIN = `tbl_households h
  JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id
  JOIN master_districts d        ON d.id  = b.district_id`

/** Area name in the request language (LGD-imported rows only have English). */
const areaName = (row: Row): string =>
  requestLang() === "en" ? row.name_en || row.name_hi : row.name_hi

export type AreaRef = { level: GeoLevel; code: string; name: string }

async function findArea(level: GeoLevel, code: string) {
  const def = levels[level]
  const row = await one<Row>(
    `SELECT a.*, a.${def.codeColumn} AS area_code FROM ${def.table} a WHERE a.${def.codeColumn} = ?`,
    [code],
  )
  if (!row) throw notFound(msg("क्षेत्र नहीं मिला"))
  return row
}

/** State → … → this area, for the breadcrumb. */
async function pathTo(level: GeoLevel, row: Row): Promise<AreaRef[]> {
  const trail: AreaRef[] = [{ level, code: row.area_code, name: areaName(row) }]
  let current = row
  let currentLevel = level
  for (let parent = parentOf(level); parent; parent = parentOf(parent)) {
    const def = levels[parent]
    const fk = levels[currentLevel].parentFk!
    current = (await one<Row>(
      `SELECT a.*, a.${def.codeColumn} AS area_code FROM ${def.table} a WHERE a.id = ?`,
      [current[fk]],
    ))!
    trail.unshift({ level: parent, code: current.area_code, name: areaName(current) })
    currentLevel = parent
  }
  return trail
}

/** Child areas with their own child counts and household / Lakhpati totals. */
async function childrenOf(level: GeoLevel, id: number) {
  const childLevel = childOf(level)!
  const def = levels[childLevel]
  const grandchild = childOf(childLevel)
  const childCount = grandchild
    ? `(SELECT COUNT(*) FROM ${levels[grandchild].table} g WHERE g.${levels[grandchild].parentFk} = c.id)`
    : "0"
  const rows = await query<Row>(
    `SELECT c.id, c.${def.codeColumn} AS code, c.name_hi, c.name_en,
            ${childLevel === "gram_panchayat" ? "c.local_body_type" : "NULL"} AS body_type,
            ${childCount} AS child_count,
            COALESCE(hh.households, 0) AS households, COALESCE(hh.lakhpati, 0) AS lakhpati
     FROM ${def.table} c
     LEFT JOIN (SELECT ${def.rollup} AS area_id, COUNT(*) AS households,
                       SUM(h.lifecycle_status = 'lakhpati') AS lakhpati
                FROM ${HOUSEHOLD_JOIN} GROUP BY ${def.rollup}) hh ON hh.area_id = c.id
     WHERE c.${def.parentFk} = ?
     ORDER BY c.name_en`,
    [id],
  )
  return { childLevel, rows }
}

async function boundaries(level: GeoLevel, codes: string[]) {
  if (!codes.length) return []
  return query<Row>(
    "SELECT lgd_code, geometry, source FROM master_boundaries WHERE level = ? AND lgd_code IN (?)",
    [level, codes],
  )
}

/** One area: breadcrumb, children with stats, and child boundaries if imported. */
export async function getArea(level: GeoLevel, code: string) {
  if (level === "village") throw notFound(msg("क्षेत्र नहीं मिला"))
  const row = await findArea(level, code)
  const [path, { childLevel, rows }] = await Promise.all([
    pathTo(level, row),
    childrenOf(level, row.id),
  ])
  const [shapes, [own]] = await Promise.all([
    boundaries(childLevel, rows.map((r) => r.code).filter(Boolean)),
    boundaries(level, [row.area_code]),
  ])
  const shapeByCode = new Map(shapes.map((s) => [s.lgd_code, s.geometry as string]))
  return {
    path,
    childLevel,
    children: rows.map((r) => ({
      code: r.code as string | null,
      name: areaName(r),
      bodyType: r.body_type as string | null,
      childCount: Number(r.child_count),
      households: Number(r.households),
      lakhpati: Number(r.lakhpati),
      hasBoundary: shapeByCode.has(r.code),
    })),
    boundaries: {
      type: "FeatureCollection" as const,
      features: rows
        .filter((r) => shapeByCode.has(r.code))
        .map((r) => ({
          type: "Feature" as const,
          properties: { code: r.code, name: areaName(r) },
          geometry: JSON.parse(shapeByCode.get(r.code)!),
        })),
    },
    // The area's own outline, drawn for context (e.g. when its children have no shapes).
    outline: own ? JSON.parse(own.geometry) : null,
    // Credit lines for the boundary data shown (e.g. OpenStreetMap's ODbL attribution).
    sources: [...new Set([...shapes, ...(own ? [own] : [])].map((s) => s.source as string))],
  }
}

/** Village detail: path, LGD code, household and SHG counts. */
export async function getVillage(code: string) {
  const row = await findArea("village", code)
  const [path, stats, shgs] = await Promise.all([
    pathTo("village", row),
    one<Row>(
      `SELECT COUNT(*) AS households, SUM(lifecycle_status = 'lakhpati') AS lakhpati,
              SUM(is_pld) AS pld, AVG(current_annual_income) AS avg_income
       FROM tbl_households WHERE village_id = ?`,
      [row.id],
    ),
    one<Row>("SELECT COUNT(*) AS shgs FROM master_shgs WHERE village_id = ?", [row.id]),
  ])
  const boundary = await one<Row>(
    "SELECT geometry FROM master_boundaries WHERE level = 'village' AND lgd_code = ?",
    [code],
  )
  return {
    path,
    households: Number(stats?.households ?? 0),
    lakhpati: Number(stats?.lakhpati ?? 0),
    pld: Number(stats?.pld ?? 0),
    avgIncome: Math.round(Number(stats?.avg_income ?? 0)),
    shgs: Number(shgs?.shgs ?? 0),
    boundary: boundary ? JSON.parse(boundary.geometry) : null,
  }
}
