// Read-only master data for the admin screens: schemes and officer mappings.
import { Router } from "express"

import { query } from "../../db/pool.ts"
import { formatDate } from "../../shared/format.ts"
import { localizedName } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"

export const schemesRouter = Router()

/** Every scheme (active or not) with its department and terms. */
schemesRouter.get("/", async (_req, res) => {
  const rows = await query<Row>(
    `SELECT s.*, d.code AS dept_code, d.name_hi AS dept_hi, d.name_en AS dept_en,
            (SELECT COUNT(*) FROM tbl_applications a WHERE a.scheme_id = s.id) AS applications
     FROM master_schemes s JOIN master_departments d ON d.id = s.department_id
     ORDER BY s.is_active DESC, d.id, s.id`,
  )
  res.json(
    rows.map((r) => ({
      code: r.code as string,
      name: localizedName(r),
      nameHi: r.name_hi as string,
      nameEn: (r.name_en as string | null) ?? "",
      department: localizedName(r, "dept"),
      departmentCode: r.dept_code as string,
      category: (r.category as string | null) ?? null,
      maxProjectCost: r.max_project_cost === null ? null : Number(r.max_project_cost),
      subsidyPercent: r.subsidy_percent === null ? null : Number(r.subsidy_percent),
      slaDays: Number(r.sla_days),
      active: Boolean(r.is_active),
      applications: Number(r.applications),
    })),
  )
})

export const officerMappingsRouter = Router()

/** Which officer (and backup) receives each block × department × scheme's applications. */
officerMappingsRouter.get("/", async (_req, res) => {
  const rows = await query<Row>(
    `SELECT m.id, m.is_active, b.name_hi AS block_hi, b.name_en AS block_en,
            d.name_hi AS dept_hi, d.name_en AS dept_en,
            s.name_hi AS scheme_hi, s.name_en AS scheme_en,
            o.name AS officer, k.name AS backup
     FROM master_officer_mappings m
     JOIN master_blocks b      ON b.id = m.block_id
     JOIN master_departments d ON d.id = m.department_id
     LEFT JOIN master_schemes s ON s.id = m.scheme_id
     JOIN master_users o       ON o.id = m.officer_user_id
     LEFT JOIN master_users k  ON k.id = m.backup_user_id
     ORDER BY b.name_en, d.id, s.id`,
  )
  res.json(
    rows.map((r) => ({
      id: r.id as number,
      block: localizedName(r, "block"),
      department: localizedName(r, "dept"),
      scheme: r.scheme_hi ? localizedName(r, "scheme") : null,
      officer: r.officer as string,
      backup: (r.backup as string | null) ?? null,
      active: Boolean(r.is_active),
    })),
  )
})

export const villageProfilesRouter = Router()

/** How many villages have a saved profile, and the most recently updated ones. */
villageProfilesRouter.get("/", async (_req, res) => {
  const rows = await query<Row>(
    `SELECT v.lgd_code, v.name_hi, v.name_en, b.name_hi AS block_hi, b.name_en AS block_en,
            p.updated_at, u.name AS updated_by, COUNT(*) OVER () AS total
     FROM tbl_village_profiles p
     JOIN master_villages v         ON v.id  = p.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b           ON b.id  = gp.block_id
     LEFT JOIN master_users u       ON u.id  = p.updated_by
     ORDER BY p.updated_at DESC LIMIT 20`,
  )
  res.json({
    total: Number(rows[0]?.total ?? 0),
    recent: rows.map((r) => ({
      code: r.lgd_code as string,
      village: localizedName(r),
      block: localizedName(r, "block"),
      updatedAt: formatDate(r.updated_at, true),
      updatedBy: (r.updated_by as string | null) ?? null,
    })),
  })
})
