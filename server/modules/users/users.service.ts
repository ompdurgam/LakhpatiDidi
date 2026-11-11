import { exec, one, query, transaction } from "../../db/pool.ts"
import { badRequest, conflict, notFound } from "../../shared/errors.ts"
import { formatDate } from "../../shared/format.ts"
import { localizedName, msg } from "../../shared/i18n.ts"
import { type Role, roleLabels, type Row } from "../../shared/types.ts"
import { allAssignments } from "../auth/assignments.ts"
import { revokeUserSessions } from "../auth/auth.service.ts"
import { type AssignmentInput, resolveAssignments, saveAssignments } from "./users.assignments.ts"

/** Every account with full contact and placement details (admin screen). */
export async function listUsers() {
  const rows = await query<Row>(
    `SELECT u.id, u.name, u.mobile, u.role, u.designation, u.status, u.last_login_at, u.created_at,
            COALESCE(di.name_hi, bd.name_hi, vd.name_hi) AS district_hi,
            COALESCE(di.name_en, bd.name_en, vd.name_en) AS district_en,
            COALESCE(b.name_hi, vb.name_hi) AS block_hi, COALESCE(b.name_en, vb.name_en) AS block_en,
            v.name_hi AS village_hi, v.name_en AS village_en,
            d.name_hi AS department_hi, d.name_en AS department_en
     FROM master_users u
     LEFT JOIN master_villages v         ON v.id  = u.village_id
     LEFT JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     LEFT JOIN master_blocks vb          ON vb.id = gp.block_id
     LEFT JOIN master_districts vd       ON vd.id = vb.district_id
     LEFT JOIN master_blocks b           ON b.id  = u.block_id
     LEFT JOIN master_districts bd       ON bd.id = b.district_id
     LEFT JOIN master_districts di       ON di.id = u.district_id
     LEFT JOIN master_departments d      ON d.id  = u.department_id
     ORDER BY FIELD(u.role, 'admin', 'state', 'district', 'department', 'block', 'field', 'didi'), u.name`,
  )
  const name = (r: Row, prefix: string) => (r[`${prefix}_hi`] ? localizedName(r, prefix) : null)
  const assignments = await allAssignments()
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    mobile: r.mobile as string,
    role: r.role as Role,
    designation: r.designation as string,
    district: name(r, "district"),
    block: name(r, "block"),
    village: name(r, "village"),
    department: name(r, "department"),
    status: r.status as "active" | "locked",
    createdAt: formatDate(r.created_at),
    lastLogin: r.last_login_at ? formatDate(r.last_login_at, true) : null,
    assignments: (assignments.get(r.id) ?? []).map((x) => ({
      role: x.role,
      level: x.level,
      areaCode: x.areaCode,
      areaName: x.areaName,
      departmentCode: x.departmentCode,
      departmentName: x.departmentName,
      path: x.path,
    })),
  }))
}

export type NewUser = {
  name: string
  mobile: string
  designation?: string
  assignments: AssignmentInput[]
}

/** Creates an account with one or more role × area assignments (the first is primary). */
export async function createUser(input: NewUser) {
  const assignments = await resolveAssignments(input.assignments)
  const designation = input.designation || roleLabels[assignments[0].role]
  try {
    await transaction(async (db) => {
      const result = await exec(
        "INSERT INTO master_users (name, mobile, role, designation) VALUES (?, ?, ?, ?)",
        [input.name, input.mobile, assignments[0].role, designation],
        db,
      )
      await saveAssignments(db, result.insertId, assignments)
    })
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      throw conflict(msg("यह मोबाइल नंबर पहले से पंजीकृत है"))
    throw error
  }
  return { name: input.name, designation }
}

/** Replaces a user's roles / areas and signs them out so the change applies at once. */
export async function updateAssignments(
  id: number,
  inputs: AssignmentInput[],
  designation?: string,
) {
  const user = await findUser(id)
  const assignments = await resolveAssignments(inputs)
  await transaction(async (db) => {
    await saveAssignments(db, user.id, assignments)
    if (designation)
      await exec("UPDATE master_users SET designation = ? WHERE id = ?", [designation, user.id], db)
  })
  await revokeUserSessions(user.id)
  return msg("{{name}} की भूमिकाएँ और क्षेत्र अपडेट हुए", { name: user.name })
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
