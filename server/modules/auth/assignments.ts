// A user's roles and the areas each covers (master_user_assignments).
import { query } from "../../db/pool.ts"
import { localizedName } from "../../shared/i18n.ts"
import type { Role, Row } from "../../shared/types.ts"

export const AREA_LEVELS = ["state", "district", "block", "gram_panchayat", "village"] as const
export type AreaLevel = (typeof AREA_LEVELS)[number]

export const AREA_TABLE: Record<Exclude<AreaLevel, "state">, string> = {
  district: "master_districts",
  block: "master_blocks",
  gram_panchayat: "master_gram_panchayats",
  village: "master_villages",
}

export type Assignment = {
  id: number
  role: Role
  level: AreaLevel
  areaId: number | null
  areaCode: string | null
  areaName: string
  departmentId: number | null
  departmentCode: string | null
  departmentName: string | null
  /** LGD codes from the district down to the area itself. */
  path: { district?: string; block?: string; gram_panchayat?: string; village?: string }
}

/** Every assignment of a user, most senior role first. */
export async function assignmentsOf(userId: number): Promise<Assignment[]> {
  return (await loadAssignments("a.user_id = ?", [userId])).get(userId) ?? []
}

/** Every user's assignments (admin user list), by user id. */
export const allAssignments = () => loadAssignments("TRUE", [])

async function loadAssignments(where: string, params: unknown[]) {
  const rows = await query<Row>(
    `SELECT a.*, d.code AS dept_code, d.name_hi AS dept_hi, d.name_en AS dept_en,
            COALESCE(di.lgd_code, b.lgd_code, gp.lgd_code, v.lgd_code) AS area_code,
            COALESCE(di.name_hi, b.name_hi, gp.name_hi, v.name_hi) AS area_hi,
            COALESCE(di.name_en, b.name_en, gp.name_en, v.name_en) AS area_en,
            -- LGD codes of the area and the areas above it (for the admin's area pickers).
            v.lgd_code AS path_village, COALESCE(gp.lgd_code, vgp.lgd_code) AS path_gp,
            COALESCE(b.lgd_code, pb.lgd_code) AS path_block,
            COALESCE(di.lgd_code, pd.lgd_code) AS path_district
     FROM master_user_assignments a
     LEFT JOIN master_departments d     ON d.id  = a.department_id
     LEFT JOIN master_districts di      ON a.area_level = 'district'       AND di.id = a.area_id
     LEFT JOIN master_blocks b          ON a.area_level = 'block'          AND b.id  = a.area_id
     LEFT JOIN master_gram_panchayats gp ON a.area_level = 'gram_panchayat' AND gp.id = a.area_id
     LEFT JOIN master_villages v        ON a.area_level = 'village'        AND v.id  = a.area_id
     LEFT JOIN master_gram_panchayats vgp ON vgp.id = v.gram_panchayat_id
     LEFT JOIN master_blocks pb         ON pb.id = COALESCE(gp.block_id, vgp.block_id)
     LEFT JOIN master_districts pd      ON pd.id = COALESCE(b.district_id, pb.district_id)
     WHERE ${where}
     ORDER BY FIELD(a.role, 'admin', 'state', 'district', 'department', 'block', 'field', 'didi'),
              FIELD(a.area_level, 'state', 'district', 'block', 'gram_panchayat', 'village'), a.id`,
    params,
  )
  const byUser = new Map<number, Assignment[]>()
  for (const r of rows) {
    const list = byUser.get(r.user_id) ?? []
    list.push(toAssignment(r))
    byUser.set(r.user_id, list)
  }
  return byUser
}

function toAssignment(r: Row): Assignment {
  return {
    id: r.id,
    role: r.role,
    level: r.area_level,
    areaId: r.area_id ?? null,
    areaCode: r.area_code ?? null,
    areaName:
      r.area_level === "state"
        ? localizedName({ name_hi: "छत्तीसगढ़", name_en: "Chhattisgarh" })
        : localizedName(r, "area"),
    departmentId: r.department_id ?? null,
    departmentCode: r.dept_code ?? null,
    departmentName: r.dept_hi ? localizedName(r, "dept") : null,
    path: {
      district: r.path_district ?? undefined,
      block: r.path_block ?? undefined,
      gram_panchayat: r.path_gp ?? undefined,
      village: r.path_village ?? undefined,
    },
  }
}

/** The distinct roles among assignments, most senior first. */
export const rolesOf = (assignments: Assignment[]) => [...new Set(assignments.map((a) => a.role))]

export type AreaRef = { level: AreaLevel; id: number | null }

/**
 * SQL keeping rows inside any of `areas`, written over the aliases
 * b (master_blocks), gp (master_gram_panchayats) and v (master_villages).
 */
export function areaCondition(areas: AreaRef[]): { sql: string; params: unknown[] } {
  if (areas.some((a) => a.level === "state")) return { sql: "1 = 1", params: [] }
  const column: Record<Exclude<AreaLevel, "state">, string> = {
    district: "b.district_id",
    block: "b.id",
    gram_panchayat: "gp.id",
    village: "v.id",
  }
  const parts: string[] = []
  const params: unknown[] = []
  for (const level of ["district", "block", "gram_panchayat", "village"] as const) {
    const ids = areas.filter((a) => a.level === level && a.id !== null).map((a) => a.id)
    if (!ids.length) continue
    parts.push(`${column[level]} IN (?)`)
    params.push(ids)
  }
  return parts.length ? { sql: `(${parts.join(" OR ")})`, params } : { sql: "1 = 0", params: [] }
}

/** The areas the user covers in the role this session works as. */
export async function sessionAreas(user: { id: number; role: Role }): Promise<AreaRef[]> {
  const rows = await query<Row>(
    "SELECT area_level, area_id FROM master_user_assignments WHERE user_id = ? AND role = ?",
    [user.id, user.role],
  )
  return rows.map((r) => ({ level: r.area_level as AreaLevel, id: r.area_id ?? null }))
}

/**
 * Rows the session may see in lists (applications, households): a condition over
 * b / gp / v, or null when its role covers the whole state.
 */
export async function sessionCondition(user: { id: number; role: Role }) {
  const areas = await sessionAreas(user)
  if (!areas.length) return { sql: "1 = 0", params: [] as unknown[] }
  const condition = areaCondition(areas)
  return condition.sql === "1 = 1" ? null : condition
}
