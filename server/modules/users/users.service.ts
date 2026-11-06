import { exec, one, query } from "../../db/pool.ts"
import { badRequest, conflict, notFound } from "../../shared/errors.ts"
import { formatDate, maskMobile } from "../../shared/format.ts"
import { localized, msg } from "../../shared/i18n.ts"
import { type Role, roleLabels, type Row } from "../../shared/types.ts"
import { revokeUserSessions } from "../auth/auth.service.ts"

export async function listUsers() {
  const rows = await query<Row>(
    `SELECT u.id, u.name, u.mobile, u.role, u.designation, u.status, u.last_login_at,
            COALESCE(v.name_hi, b.name_hi, CONCAT(d.name_hi, ' • ', di.name_hi), di.name_hi, 'छत्तीसगढ़') AS scope,
            COALESCE(v.name_en, b.name_en, CONCAT(d.name_en, ' • ', di.name_en), di.name_en, 'Chhattisgarh') AS scope_en
     FROM master_users u
     LEFT JOIN master_villages v    ON v.id  = u.village_id
     LEFT JOIN master_blocks b      ON b.id  = u.block_id
     LEFT JOIN master_departments d ON d.id  = u.department_id
     LEFT JOIN master_districts di  ON di.id = u.district_id
     ORDER BY u.id`,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    mobile: maskMobile(r.mobile),
    role: r.role,
    designation: r.designation,
    scope: localized(r, "scope"),
    status: r.status,
    lastLogin: r.last_login_at ? formatDate(r.last_login_at, true) : "—",
  }))
}

export type NewUser = {
  name: string
  mobile: string
  role: Role
  designation?: string
  block?: string
}

export async function createUser(input: NewUser) {
  const designation = input.designation || roleLabels[input.role]
  const block = input.block
    ? await one<Row>("SELECT id FROM master_blocks WHERE code = ?", [input.block])
    : undefined
  const district = await one<Row>("SELECT id FROM master_districts WHERE code = 'BST'")
  const statewide = input.role === "state" || input.role === "admin"
  try {
    await exec(
      "INSERT INTO master_users (name, mobile, role, designation, district_id, block_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        input.name,
        input.mobile,
        input.role,
        designation,
        statewide ? null : (district?.id ?? null),
        block?.id ?? null,
      ],
    )
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      throw conflict(msg("यह मोबाइल नंबर पहले से पंजीकृत है"))
    throw error
  }
  return { name: input.name, designation }
}

async function findUser(id: number) {
  const user = await one<Row>("SELECT id, name FROM master_users WHERE id = ?", [id])
  if (!user) throw notFound(msg("यूज़र नहीं मिला"))
  return user
}

export async function setUserStatus(id: number, status: "active" | "locked", actorId: number) {
  const user = await findUser(id)
  if (user.id === actorId && status === "locked")
    throw badRequest(msg("आप अपना खाता लॉक नहीं कर सकते"))
  await exec("UPDATE master_users SET status = ? WHERE id = ?", [status, user.id])
  if (status === "locked") await revokeUserSessions(user.id)
  return status === "locked"
    ? msg("{{name}} लॉक किया गया", { name: user.name })
    : msg("{{name}} सक्रिय किया गया", { name: user.name })
}

/** Ends the user's sessions and invalidates pending OTPs. */
export async function resetUserOtp(id: number) {
  const user = await findUser(id)
  await revokeUserSessions(user.id)
  await exec(
    `UPDATE tbl_otp_requests o JOIN master_users u ON u.mobile = o.mobile
     SET o.consumed_at = NOW() WHERE u.id = ? AND o.consumed_at IS NULL`,
    [user.id],
  )
  return msg("{{name}} का OTP रीसेट लिंक भेजा गया", { name: user.name })
}
