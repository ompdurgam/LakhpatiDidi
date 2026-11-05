import { exec, one, query } from "../../db/pool.ts"
import { badRequest, conflict, notFound } from "../../shared/errors.ts"
import { dateHi, maskMobile } from "../../shared/format.ts"
import { type Role, roleLabels, type Row } from "../../shared/types.ts"
import { revokeUserSessions } from "../auth/auth.service.ts"

export async function listUsers() {
  const rows = await query<Row>(
    `SELECT u.id, u.name, u.mobile, u.role, u.designation, u.status, u.last_login_at,
            COALESCE(v.name_hi, b.name_hi, CONCAT(d.name_hi, ' • ', di.name_hi), di.name_hi, 'छत्तीसगढ़') AS scope
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
    scope: r.scope,
    status: r.status,
    lastLogin: r.last_login_at ? dateHi(r.last_login_at, true) : "—",
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
      throw conflict("यह मोबाइल नंबर पहले से पंजीकृत है")
    throw error
  }
  return { name: input.name, designation }
}

async function findUser(id: number) {
  const user = await one<Row>("SELECT id, name FROM master_users WHERE id = ?", [id])
  if (!user) throw notFound("यूज़र नहीं मिला")
  return user
}

export async function setUserStatus(id: number, status: "active" | "locked", actorId: number) {
  const user = await findUser(id)
  if (user.id === actorId && status === "locked") throw badRequest("आप अपना खाता लॉक नहीं कर सकते")
  await exec("UPDATE master_users SET status = ? WHERE id = ?", [status, user.id])
  if (status === "locked") await revokeUserSessions(user.id)
  return `${user.name} ${status === "locked" ? "लॉक किया गया" : "सक्रिय किया गया"}`
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
  return `${user.name} का OTP रीसेट लिंक भेजा गया`
}
