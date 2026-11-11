// Validates and saves a user's role × area assignments (admin user management).
import { z } from "zod"

import { type Db, exec, one } from "../../db/pool.ts"
import { badRequest } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import type { Role, Row } from "../../shared/types.ts"
import { AREA_LEVELS, AREA_TABLE, type AreaLevel } from "../auth/assignments.ts"

export const ROLES = ["field", "block", "department", "district", "state", "admin", "didi"] as const

/** The area levels each role may be given. */
const ALLOWED: Record<Role, AreaLevel[]> = {
  admin: ["state"],
  state: ["state"],
  district: ["district"],
  department: ["state", "district", "block"],
  block: ["block"],
  field: ["block", "gram_panchayat", "village"],
  didi: ["village"],
}

export const assignmentInput = z.object({
  role: z.enum(ROLES, { error: () => msg("मान्य भूमिका चुनें") }),
  level: z.enum(AREA_LEVELS, { error: () => msg("मान्य क्षेत्र स्तर चुनें") }),
  /** LGD code of the district / block / GP / village (none for the state). */
  area: z.string().trim().max(20).optional(),
  /** Department code, for a department role. */
  department: z.string().trim().max(20).optional(),
})
export type AssignmentInput = z.infer<typeof assignmentInput>

type Resolved = { role: Role; level: AreaLevel; areaId: number | null; departmentId: number | null }

/** Checks each assignment and looks up its area and department ids. */
export async function resolveAssignments(inputs: AssignmentInput[]): Promise<Resolved[]> {
  if (!inputs.length) throw badRequest(msg("कम से कम एक भूमिका और क्षेत्र चुनें"))
  const out: Resolved[] = []
  for (const a of inputs) {
    if (!ALLOWED[a.role].includes(a.level))
      throw badRequest(msg("यह भूमिका इस क्षेत्र स्तर पर नहीं दी जा सकती"))
    let areaId: number | null = null
    if (a.level !== "state") {
      if (!a.area) throw badRequest(msg("क्षेत्र चुनें"))
      // LGD code; places not from the LGD import are found by their master code.
      const row = await one<Row>(
        `SELECT id FROM ${AREA_TABLE[a.level]} WHERE lgd_code = ? OR code = ? LIMIT 1`,
        [a.area, a.area],
      )
      if (!row) throw badRequest(msg("क्षेत्र नहीं मिला"))
      areaId = row.id
    }
    let departmentId: number | null = null
    if (a.role === "department") {
      if (!a.department) throw badRequest(msg("विभाग चुनें"))
      const dept = await one<Row>("SELECT id FROM master_departments WHERE code = ?", [
        a.department,
      ])
      if (!dept) throw badRequest(msg("विभाग नहीं मिला"))
      departmentId = dept.id
    }
    const duplicate = out.some(
      (o) =>
        o.role === a.role &&
        o.level === a.level &&
        o.areaId === areaId &&
        o.departmentId === departmentId,
    )
    if (!duplicate) out.push({ role: a.role, level: a.level, areaId, departmentId })
  }
  return out
}

/**
 * Replaces a user's assignments, and keeps master_users' single role / area columns
 * on the first one (the primary) for code that needs one value.
 */
export async function saveAssignments(db: Db, userId: number, assignments: Resolved[]) {
  await exec("DELETE FROM master_user_assignments WHERE user_id = ?", [userId], db)
  for (const a of assignments)
    await exec(
      `INSERT INTO master_user_assignments (user_id, role, area_level, area_id, department_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, a.role, a.level, a.areaId, a.departmentId],
      db,
    )
  const primary = assignments[0]
  const place = await primaryPlace(db, primary)
  await exec(
    `UPDATE master_users SET role = ?, district_id = ?, block_id = ?, village_id = ?, department_id = ?
     WHERE id = ?`,
    [primary.role, place.district, place.block, place.village, primary.departmentId, userId],
    db,
  )
}

/** District / block / village ids of an assignment's area (a GP keeps its block). */
async function primaryPlace(db: Db, a: Resolved) {
  const none = { district: null, block: null, village: null } as Record<string, number | null>
  if (a.level === "state" || a.areaId === null) return none
  if (a.level === "district") return { ...none, district: a.areaId }
  const row = await one<Row>(
    a.level === "block"
      ? "SELECT b.id AS block, b.district_id AS district FROM master_blocks b WHERE b.id = ?"
      : a.level === "gram_panchayat"
        ? `SELECT b.id AS block, b.district_id AS district FROM master_gram_panchayats gp
           JOIN master_blocks b ON b.id = gp.block_id WHERE gp.id = ?`
        : `SELECT v.id AS village, b.id AS block, b.district_id AS district FROM master_villages v
           JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
           JOIN master_blocks b ON b.id = gp.block_id WHERE v.id = ?`,
    [a.areaId],
    db,
  )
  return {
    district: row?.district ?? null,
    block: row?.block ?? null,
    // A village assignment is the user's village; other levels leave it empty.
    village: a.level === "village" ? (row?.village ?? null) : null,
  }
}
