// Resolves each (district, block, panchayat, village) of the PLD list to a row
// in master_villages. LGD rows are matched by name (exact, then close spelling);
// panchayats and villages that LGD does not have are added without an LGD code.
import type { PoolConnection } from "mysql2/promise"

import { exec, query } from "../pool.ts"
import { bestMatch, districtAliases, normalise, pickByOverlap } from "./places.ts"
import type { PldRow } from "./sheet.ts"

type Area = {
  id: number
  parent_id: number
  name_en: string
  code: string
  lgd_code: string | null
}
export type Place = { villageId: number; hhPrefix: string }
export type NewPlace = {
  level: "panchayat" | "village"
  district: string
  block: string
  name: string
}
export type HowMatched = "lgd" | "village-in-block" | "new-village" | "new-panchayat"

export const placeKey = (r: PldRow) => [r.district, r.block, r.panchayat, r.village].join("|")

const load = (db: PoolConnection, table: string, parent: string) =>
  query<Area>(`SELECT id, ${parent} AS parent_id, name_en, code, lgd_code FROM ${table}`, [], db)

function groupBy<T>(items: T[], key: (item: T) => number) {
  const map = new Map<number, T[]>()
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item])
  return map
}

const byName = (areas: Area[] = []) => new Map(areas.map((a) => [normalise(a.name_en), a]))

/**
 * Exact name among all areas, else a close spelling among LGD areas only. Places
 * this import added (no LGD code) match exactly, so re-runs find them again
 * instead of letting them crowd out a fuzzy LGD match.
 */
const find = (name: string, areas: Area[] = []) =>
  byName(areas).get(name) ?? bestMatch(name, byName(areas.filter((a) => a.lgd_code)))

export async function resolvePlaces(db: PoolConnection, rows: PldRow[]) {
  const [districts, blocks, gps, villages] = await Promise.all([
    load(db, "master_districts", "state_id"),
    load(db, "master_blocks", "district_id"),
    load(db, "master_gram_panchayats", "block_id"),
    load(db, "master_villages", "gram_panchayat_id"),
  ])
  if (!villages.length) throw new Error("no villages — run `npm run geo:lgd` first")
  const blocksOf = groupBy(blocks, (b) => b.parent_id)
  const gpsOf = groupBy(gps, (g) => g.parent_id)
  const villagesOf = groupBy(villages, (v) => v.parent_id)

  // District → block, checked up front: an unknown one stops the import.
  const districtByName = byName(districts)
  const blockOf = new Map<string, Area>()
  const sheetGps = new Map<string, Set<string>>()
  for (const r of rows) {
    const key = `${r.district}|${r.block}`
    sheetGps.set(key, (sheetGps.get(key) ?? new Set()).add(normalise(r.panchayat)))
  }
  const unknown: string[] = []
  for (const [key, gpNames] of sheetGps) {
    const [district, block] = key.split("|")
    const d = bestMatch(normalise(districtAliases[normalise(district)] ?? district), districtByName)
    const options = (d ? (blocksOf.get(d.id) ?? []) : []).map((b) => ({
      id: b,
      name: normalise(b.name_en),
      childNames: new Set((gpsOf.get(b.id) ?? []).map((g) => normalise(g.name_en))),
    }))
    const b = pickByOverlap(normalise(block), gpNames, options)
    if (!d || !b) unknown.push(key.replace("|", " / "))
    else
      blockOf.set(key, {
        ...b,
        parent_id: d.id,
        code: `${d.lgd_code ?? d.code}-${b.lgd_code ?? b.code}`,
      })
  }
  if (unknown.length) throw new Error(`unknown district / block: ${unknown.join("; ")}`)

  // PGP<n> / PV<n> codes share one counter, so re-runs never reuse a code.
  let [{ n: nextCode }] = await query<{ n: number }>(
    `SELECT (SELECT COUNT(*) FROM master_villages WHERE code LIKE 'PV%')
          + (SELECT COUNT(*) FROM master_gram_panchayats WHERE code LIKE 'PGP%') + 1 AS n`,
    [],
    db,
  )
  const insert = async (
    table: string,
    parent: string,
    parentId: number,
    prefix: string,
    name: string,
  ) => {
    const code = `${prefix}${nextCode++}`
    const res = await exec(
      `INSERT INTO ${table} (${parent}, code, name_hi, name_en) VALUES (?, ?, ?, ?)`,
      [parentId, code, name, name],
      db,
    )
    return { id: res.insertId, parent_id: parentId, name_en: name, code, lgd_code: null }
  }

  const places = new Map<string, Place>()
  const how = new Map<string, HowMatched>()
  const created: NewPlace[] = []
  const gpCache = new Map<string, Area | undefined>()
  for (const r of rows) {
    const key = placeKey(r)
    if (places.has(key)) continue
    const block = blockOf.get(`${r.district}|${r.block}`)!
    const gpKey = `${block.id}|${normalise(r.panchayat)}`
    if (!gpCache.has(gpKey)) gpCache.set(gpKey, find(normalise(r.panchayat), gpsOf.get(block.id)))
    let gp = gpCache.get(gpKey)
    let village = gp && find(normalise(r.village), villagesOf.get(gp.id))
    let matched: HowMatched = "lgd"

    if (!village) {
      // Same village name filed under another panchayat of the block (GPs get reorganised).
      const inBlock = (gpsOf.get(block.id) ?? []).flatMap((g) =>
        (villagesOf.get(g.id) ?? []).filter((v) => normalise(v.name_en) === normalise(r.village)),
      )
      if (inBlock.length === 1) [village, matched] = [inBlock[0], "village-in-block"]
    }
    if (!village) {
      matched = gp ? "new-village" : "new-panchayat"
      if (!gp) {
        gp = await insert("master_gram_panchayats", "block_id", block.id, "PGP", r.panchayat)
        gpCache.set(gpKey, gp)
        gpsOf.set(block.id, [...(gpsOf.get(block.id) ?? []), gp])
        created.push({
          level: "panchayat",
          district: r.district,
          block: r.block,
          name: r.panchayat,
        })
      }
      village = await insert("master_villages", "gram_panchayat_id", gp.id, "PV", r.village)
      villagesOf.set(gp.id, [...(villagesOf.get(gp.id) ?? []), village])
      created.push({
        level: "village",
        district: r.district,
        block: r.block,
        name: `${r.panchayat} / ${r.village}`,
      })
    }
    places.set(key, { villageId: village.id, hhPrefix: block.code })
    how.set(key, matched)
  }
  return { places, how, created }
}
