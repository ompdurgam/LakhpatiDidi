import { one } from "../../db/pool.ts"
import { notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import { getApplicationDetail } from "../applications/applications.service.ts"

/**
 * One of the signed-in Didi's own applications. Ownership is checked against her
 * verified mobile, so another household's code answers "not found", never its data.
 * Staff comments are internal discussion and are left out.
 */
export async function getDidiApplication(mobile: string, code: string) {
  const owned = await one(
    `SELECT a.id FROM tbl_applications a
     JOIN tbl_households h ON h.id = a.household_id
     WHERE a.app_code = ? AND h.mobile = ?`,
    [code, mobile],
  )
  if (!owned) throw notFound(msg("आवेदन नहीं मिला"))
  const detail = await getApplicationDetail(code)
  return { ...detail, comments: [] }
}
