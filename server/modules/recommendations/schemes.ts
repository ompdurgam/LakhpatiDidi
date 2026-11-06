import { query } from "../../db/pool.ts"
import { localized, localizedName } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"

export type SchemeInfo = {
  id: number
  code: string
  name: string
  department: string
  departmentId: number
  maxCost: number
  subsidyPercent: number
  slaDays: number
  category: string
}

/** Active schemes by code, named in the request language. */
export async function loadSchemes() {
  const rows = await query<Row>(
    `SELECT s.id, s.code, s.name_hi, s.name_en, s.department_id, s.max_project_cost,
            s.subsidy_percent, s.sla_days, s.category,
            d.name_hi AS department, d.name_en AS department_en
     FROM master_schemes s JOIN master_departments d ON d.id = s.department_id
     WHERE s.is_active = 1`,
  )
  return new Map(
    rows.map((r) => [
      r.code as string,
      {
        id: r.id,
        code: r.code,
        name: localizedName(r),
        department: localized(r, "department"),
        departmentId: r.department_id,
        maxCost: Number(r.max_project_cost ?? 0),
        subsidyPercent: Number(r.subsidy_percent),
        slaDays: Number(r.sla_days),
        category: r.category,
      } satisfies SchemeInfo,
    ]),
  )
}
