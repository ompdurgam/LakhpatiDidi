// Which area a dashboard shows, and per-village household figures to roll up.
//
// Rolling 6 lakh households up on every request takes ~2 s, so the per-village
// figures are cached for a short time and every level is summed from them.
import { one, query } from "../../db/pool.ts"
import { HttpError, notFound } from "../../shared/errors.ts"
import { localizedName, msg } from "../../shared/i18n.ts"
import type { Row, SessionUser } from "../../shared/types.ts"
import { sessionAreas } from "../auth/assignments.ts"

export type DashLevel = "state" | "district" | "block"
export const CHILD_LEVEL = {
  state: "district",
  district: "block",
  block: "gram_panchayat",
} as const

export type Area = {
  level: DashLevel
  id: number
  code: string
  name: string
  /** SQL condition (on the b = master_blocks alias) that keeps rows inside the area. */
  blockFilter: string
  params: number[]
}

const TABLE = { state: "master_states", district: "master_districts", block: "master_blocks" }

/**
 * The dashboard areas the session's role covers: each assignment's district / block,
 * or the state (a gram panchayat or village assignment shows its block).
 */
export async function dashboardAreas(user: SessionUser): Promise<Area[]> {
  const areas = await sessionAreas(user)
  if (!areas.length) throw new HttpError(403, msg("आपके खाते में कोई क्षेत्र नहीं जुड़ा है"))
  if (areas.some((a) => a.level === "state")) return [await findArea("state", "CG")]
  const out = new Map<string, Area>()
  for (const a of areas) {
    const area =
      a.level === "district" || a.level === "block"
        ? await findAreaById(a.level, a.id!)
        : await findAreaById("block", await blockOf(a.level as "gram_panchayat" | "village", a.id!))
    out.set(`${area.level}:${area.id}`, area)
  }
  return [...out.values()]
}

async function blockOf(level: "gram_panchayat" | "village", id: number) {
  const row = await one<Row>(
    level === "gram_panchayat"
      ? "SELECT block_id FROM master_gram_panchayats WHERE id = ?"
      : `SELECT gp.block_id FROM master_villages v
         JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id WHERE v.id = ?`,
    [id],
  )
  return row?.block_id as number
}

/**
 * The dashboard to show: the requested area when it lies inside one of the session's
 * areas, else the first of them.
 */
export async function resolveArea(
  user: SessionUser,
  requested?: { level: DashLevel; code: string },
): Promise<Area> {
  const own = await dashboardAreas(user)
  if (!requested) return own[0]
  const area = await findArea(requested.level, requested.code)
  for (const o of own) if (await contains(o, area)) return area
  throw new HttpError(403, msg("यह क्षेत्र आपके दायरे से बाहर है"))
}

async function findArea(level: DashLevel, code: string): Promise<Area> {
  const column = level === "state" ? "code" : "lgd_code"
  const row = await one<Row>(`SELECT * FROM ${TABLE[level]} WHERE ${column} = ?`, [code])
  if (!row) throw notFound(msg("क्षेत्र नहीं मिला"))
  return toArea(level, row)
}

async function findAreaById(level: DashLevel, id: number): Promise<Area> {
  const row = await one<Row>(`SELECT * FROM ${TABLE[level]} WHERE id = ?`, [id])
  if (!row) throw notFound(msg("क्षेत्र नहीं मिला"))
  return toArea(level, row)
}

function toArea(level: DashLevel, row: Row): Area {
  return {
    level,
    id: row.id,
    code: level === "state" ? row.code : row.lgd_code,
    name: localizedName(row),
    blockFilter:
      level === "state" ? "1 = 1" : level === "district" ? "b.district_id = ?" : "b.id = ?",
    params: level === "state" ? [] : [row.id],
  }
}

/** Whether `area` lies inside `own` (the state contains everything). */
async function contains(own: Area, area: Area) {
  if (own.level === "state") return true
  if (own.level === area.level) return own.id === area.id
  if (own.level === "district" && area.level === "block") {
    const b = await one<Row>("SELECT district_id FROM master_blocks WHERE id = ?", [area.id])
    return b?.district_id === own.id
  }
  return false
}

// ── Per-village household figures ──────────────────────────────────────────

export type VillageStats = {
  villageId: number
  gpId: number
  blockId: number
  districtId: number
  households: number
  pld: number
  surveyed: number
  lakhpati: number
  threshold: number
  singleSource: number
  /** Surveyed households by annual income: <50K, 50–80K, 80K–1L, 1L+. */
  bands: [number, number, number, number]
  incomeSum: number
}

const TTL_MS = 2 * 60_000
let cache: { at: number; rows: Promise<VillageStats[]> } | null = null

/** Every village with households, with the figures dashboards add up. */
export function villageStats(): Promise<VillageStats[]> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const rows = loadVillageStats()
    cache = { at: Date.now(), rows }
    rows.catch(() => (cache = null))
  }
  return cache.rows
}

async function loadVillageStats(): Promise<VillageStats[]> {
  const rows = await query<Row>(
    `SELECT s.*, v.gram_panchayat_id AS gp_id, gp.block_id, b.district_id
     FROM (SELECT h.village_id,
                  COUNT(*) AS households,
                  SUM(h.is_pld) AS pld,
                  SUM(h.surveyed_at IS NOT NULL) AS surveyed,
                  SUM(h.lifecycle_status = 'lakhpati') AS lakhpati,
                  SUM(h.lifecycle_status = 'threshold') AS threshold,
                  SUM(h.lifecycle_status = 'single_source') AS single_source,
                  SUM(h.surveyed_at IS NOT NULL AND h.current_annual_income < 50000) AS b0,
                  SUM(h.surveyed_at IS NOT NULL AND h.current_annual_income >= 50000
                      AND h.current_annual_income < 80000) AS b1,
                  SUM(h.surveyed_at IS NOT NULL AND h.current_annual_income >= 80000
                      AND h.current_annual_income < 100000) AS b2,
                  SUM(h.surveyed_at IS NOT NULL AND h.current_annual_income >= 100000) AS b3,
                  SUM(IF(h.surveyed_at IS NULL, 0, h.current_annual_income)) AS income_sum
           FROM tbl_households h GROUP BY h.village_id) s
     JOIN master_villages v         ON v.id  = s.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b           ON b.id  = gp.block_id`,
  )
  return rows.map((r) => ({
    villageId: r.village_id,
    gpId: r.gp_id,
    blockId: r.block_id,
    districtId: r.district_id,
    households: Number(r.households),
    pld: Number(r.pld),
    surveyed: Number(r.surveyed),
    lakhpati: Number(r.lakhpati),
    threshold: Number(r.threshold),
    singleSource: Number(r.single_source),
    bands: [Number(r.b0), Number(r.b1), Number(r.b2), Number(r.b3)],
    incomeSum: Number(r.income_sum),
  }))
}

/** Drops the cached figures (call after a survey changes a household). */
export const invalidateVillageStats = () => (cache = null)

/** The villages inside an area. */
export const inArea = (rows: VillageStats[], area: Area) =>
  area.level === "state"
    ? rows
    : rows.filter((r) => (area.level === "district" ? r.districtId : r.blockId) === area.id)

/** Which child area a village belongs to on this dashboard. */
export const childKey = (row: VillageStats, area: Area) =>
  area.level === "state" ? row.districtId : area.level === "district" ? row.blockId : row.gpId
