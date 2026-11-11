// Household-side dashboard figures: totals, child areas, income bands,
// Lakhpati Gram candidates, sectors, loans, entitlement gaps and surveyors.
import { query } from "../../db/pool.ts"
import { localizedName } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import {
  type Area,
  CHILD_LEVEL,
  childKey,
  inArea,
  type VillageStats,
  villageStats,
} from "./monitoring.area.ts"

/** A village is a Lakhpati Gram candidate once more than half its surveyed PLDs crossed ₹1 lakh. */
const CANDIDATE_SHARE = 0.5
/** …and enough of its PLDs have been surveyed for that share to mean something. */
const CANDIDATE_MIN_SURVEYED = 10

type Totals = Omit<VillageStats, "villageId" | "gpId" | "blockId" | "districtId">

const emptyTotals = (): Totals => ({
  households: 0,
  pld: 0,
  surveyed: 0,
  lakhpati: 0,
  threshold: 0,
  singleSource: 0,
  bands: [0, 0, 0, 0],
  incomeSum: 0,
})

function add(into: Totals, row: VillageStats) {
  into.households += row.households
  into.pld += row.pld
  into.surveyed += row.surveyed
  into.lakhpati += row.lakhpati
  into.threshold += row.threshold
  into.singleSource += row.singleSource
  into.incomeSum += row.incomeSum
  row.bands.forEach((n, i) => (into.bands[i] += n))
  return into
}

const CHILD_TABLE = {
  district: "master_districts",
  block: "master_blocks",
  gram_panchayat: "master_gram_panchayats",
}
const PARENT_FK = { district: "state_id", block: "district_id", gram_panchayat: "block_id" }

/** Totals for the area and for each of its child areas (all children, even empty ones). */
export async function householdFigures(area: Area) {
  const rows = inArea(await villageStats(), area)
  const totals = rows.reduce(add, emptyTotals())
  const byChild = new Map<number, Totals>()
  for (const row of rows) {
    const key = childKey(row, area)
    byChild.set(key, add(byChild.get(key) ?? emptyTotals(), row))
  }
  const childLevel = CHILD_LEVEL[area.level]
  const childRows = await query<Row>(
    `SELECT id, lgd_code, name_hi, name_en FROM ${CHILD_TABLE[childLevel]}
     WHERE ${PARENT_FK[childLevel]} = ? ORDER BY name_en`,
    [area.id],
  )
  const children = childRows.map((c) => {
    const t = byChild.get(c.id) ?? emptyTotals()
    return {
      id: c.id as number,
      code: c.lgd_code as string,
      name: localizedName(c),
      households: t.households,
      pld: t.pld,
      surveyed: t.surveyed,
      lakhpati: t.lakhpati,
    }
  })
  return {
    totals: {
      households: totals.households,
      pld: totals.pld,
      surveyed: totals.surveyed,
      lakhpati: totals.lakhpati,
      threshold: totals.threshold,
      singleSource: totals.singleSource,
      avgIncome: totals.surveyed ? Math.round(totals.incomeSum / totals.surveyed) : 0,
    },
    incomeBands: totals.bands,
    children,
    candidates: await candidateVillages(rows),
  }
}

async function candidateVillages(rows: VillageStats[]) {
  const picked = rows
    .filter(
      (r) => r.surveyed >= CANDIDATE_MIN_SURVEYED && r.bands[3] / r.surveyed > CANDIDATE_SHARE,
    )
    .sort((a, b) => b.bands[3] / b.surveyed - a.bands[3] / a.surveyed)
    .slice(0, 8)
  if (!picked.length) return []
  const names = await query<Row>(
    `SELECT v.id, v.lgd_code, v.name_hi, v.name_en, b.name_hi AS block_hi, b.name_en AS block_en
     FROM master_villages v
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b ON b.id = gp.block_id
     WHERE v.id IN (?)`,
    [picked.map((r) => r.villageId)],
  )
  const byId = new Map(names.map((n) => [n.id as number, n]))
  return picked.map((r) => {
    const n = byId.get(r.villageId)!
    return {
      code: n.lgd_code as string,
      name: localizedName(n),
      block: localizedName(n, "block"),
      pld: r.pld,
      surveyed: r.surveyed,
      lakhpatiPct: Math.round((r.bands[3] / r.surveyed) * 100),
    }
  })
}

// Households inside the area, for the smaller survey-only tables.
const AREA_HOUSEHOLDS = `tbl_households h
  JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id`

/** Income sources reported in surveys (households per source). */
export async function sectors(area: Area) {
  const rows = await query<Row>(
    `SELECT s.source_name, COUNT(DISTINCT s.household_id) AS households
     FROM tbl_household_income_sources s JOIN ${AREA_HOUSEHOLDS} ON h.id = s.household_id
     WHERE ${area.blockFilter}
     GROUP BY s.source_name ORDER BY households DESC LIMIT 8`,
    area.params,
  )
  return rows.map((r) => ({ name: r.source_name as string, households: Number(r.households) }))
}

/** Loans reported in surveys, by lender type. */
export async function loans(area: Area) {
  const rows = await query<Row>(
    `SELECT l.lender_type, SUM(l.principal) AS amount, COUNT(DISTINCT l.household_id) AS households
     FROM tbl_household_loans l JOIN ${AREA_HOUSEHOLDS} ON h.id = l.household_id
     WHERE ${area.blockFilter}
     GROUP BY l.lender_type ORDER BY amount DESC`,
    area.params,
  )
  return rows.map((r) => ({
    lender: r.lender_type as string,
    amount: Number(r.amount),
    households: Number(r.households),
  }))
}

/** Open / closed entitlement gaps, and open gaps per scheme × child area. */
export async function entitlementGaps(area: Area) {
  const childColumn =
    area.level === "state" ? "b.district_id" : area.level === "district" ? "b.id" : "gp.id"
  const rows = await query<Row>(
    `SELECT s.code AS scheme, s.name_hi, s.name_en, ${childColumn} AS child_id,
            SUM(g.status = 'open') AS open, SUM(g.status = 'closed') AS closed
     FROM tbl_entitlement_gaps g
     JOIN master_schemes s ON s.id = g.scheme_id
     JOIN ${AREA_HOUSEHOLDS} ON h.id = g.household_id
     WHERE ${area.blockFilter}
     GROUP BY s.id, child_id`,
    area.params,
  )
  return {
    open: rows.reduce((sum, r) => sum + Number(r.open), 0),
    closed: rows.reduce((sum, r) => sum + Number(r.closed), 0),
    cells: rows.map((r) => ({
      scheme: r.scheme as string,
      schemeName: localizedName(r),
      childId: r.child_id as number,
      open: Number(r.open),
    })),
  }
}

/** Surveyors (CRPs) working in the area and their survey counts. */
export async function surveyors(area: Area) {
  const rows = await query<Row>(
    `SELECT u.id, u.name,
            -- A surveyor works their village, or the whole block when no village is set
            -- (the same area as their survey worklist).
            IF(u.village_id IS NOT NULL,
               (SELECT COUNT(*) FROM tbl_households x WHERE x.village_id = u.village_id),
               (SELECT COUNT(*) FROM tbl_households x
                  JOIN master_villages xv ON xv.id = x.village_id
                  JOIN master_gram_panchayats xg ON xg.id = xv.gram_panchayat_id
                WHERE xg.block_id = b.id)) AS assigned,
            (SELECT COUNT(*) FROM tbl_surveys s WHERE s.surveyor_id = u.id AND s.status = 'submitted') AS submitted,
            (SELECT COUNT(*) FROM tbl_surveys s WHERE s.surveyor_id = u.id AND s.status = 'draft') AS drafts
     FROM master_users u
     LEFT JOIN master_villages v         ON v.id  = u.village_id
     LEFT JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b ON b.id = COALESCE(u.block_id, gp.block_id)
     WHERE u.role = 'field' AND u.status = 'active' AND ${area.blockFilter}
     ORDER BY submitted DESC, u.name LIMIT 50`,
    area.params,
  )
  return rows.map((r) => ({
    name: r.name as string,
    assigned: Number(r.assigned),
    submitted: Number(r.submitted),
    drafts: Number(r.drafts),
  }))
}

/** Households with a monthly income entry for the current month. */
export async function monthlyUpdates(area: Area) {
  const [r] = await query<Row>(
    `SELECT COUNT(DISTINCT m.household_id) AS updated
     FROM tbl_monthly_income_entries m JOIN ${AREA_HOUSEHOLDS} ON h.id = m.household_id
     WHERE m.month = DATE_FORMAT(CURDATE(), '%Y-%m-01') AND ${area.blockFilter}`,
    area.params,
  )
  return Number(r.updated)
}
