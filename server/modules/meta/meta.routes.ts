import { Router } from "express"

import { query } from "../../db/pool.ts"
import { localized } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"

/** Master data used by filters and forms. */
export const metaRouter = Router()

metaRouter.get("/", async (_req, res) => {
  const [departments, blocks, villages, clfs, vos, schemes] = await Promise.all([
    query<Row>(
      "SELECT code, name_hi AS name, name_en FROM master_departments WHERE is_active = 1 ORDER BY id",
    ),
    // All blocks (admins assign users to any block); `active` marks those with data,
    // which is what the register and inbox filters list.
    query<Row>(
      `SELECT b.code, b.name_hi AS name, b.name_en,
              (EXISTS (SELECT 1 FROM tbl_applications a WHERE a.block_id = b.id)
               OR EXISTS (SELECT 1 FROM tbl_households h
                          JOIN master_villages v ON v.id = h.village_id
                          JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
                          WHERE gp.block_id = b.id)) AS active
       FROM master_blocks b ORDER BY b.id`,
    ),
    // Only villages with surveyed households: the full LGD list (20,000+) would bloat
    // this response and repeats many names across districts.
    query<Row>(
      `SELECT v.code, v.name_hi AS name, v.name_en FROM master_villages v
       WHERE EXISTS (SELECT 1 FROM tbl_households h WHERE h.village_id = v.id) ORDER BY v.id`,
    ),
    query<Row>("SELECT name FROM master_clfs ORDER BY id"),
    query<Row>("SELECT name FROM master_village_organisations ORDER BY id"),
    query<Row>(
      `SELECT s.code, s.name_hi AS name, s.name_en, d.name_hi AS department, d.name_en AS department_en,
              s.subsidy_percent AS subsidyPercent, s.sla_days AS slaDays
       FROM master_schemes s JOIN master_departments d ON d.id = s.department_id
       WHERE s.is_active = 1 ORDER BY s.id`,
    ),
  ])
  const named = (r: Row) => ({ code: r.code, name: localized(r, "name") })
  res.json({
    departments: departments.map(named),
    blocks: blocks.map((r) => ({ ...named(r), active: Boolean(r.active) })),
    villages: villages.map(named),
    clfs: clfs.map((r) => r.name),
    vos: vos.map((r) => r.name),
    schemes: schemes.map((r) => ({
      ...named(r),
      department: localized(r, "department"),
      subsidyPercent: r.subsidyPercent,
      slaDays: r.slaDays,
    })),
  })
})
