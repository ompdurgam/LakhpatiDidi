import crypto from "node:crypto"

import { config } from "../../config.ts"
import { exec, one, transaction } from "../../db/pool.ts"
import { HttpError } from "../../shared/errors.ts"
import { initials, maskMobile, sha256 } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import type { Role, Row, SessionUser } from "../../shared/types.ts"
import { assignmentsOf, rolesOf } from "./assignments.ts"

const otpHash = (mobile: string, otp: string) => sha256(`${mobile}:${otp}`)

/** The district / block a user works in (LGD codes and names in both languages). */
export type UserScope = {
  districtLgd: string | null
  districtHi: string | null
  districtEn: string | null
  blockLgd: string | null
  blockHi: string | null
  blockEn: string | null
}

export type PublicUser = {
  id: number
  name: string
  /** The role this session works as. */
  role: string
  /** Every role the user holds (the login screen and header switcher offer only these). */
  roles: Role[]
  designation: string
  initials: string
  scope: UserScope
  assignments: {
    role: Role
    level: string
    areaCode: string | null
    areaName: string
    departmentCode: string | null
    departmentName: string | null
  }[]
}

type UserFields = { id: number; name: string; role: string; designation: string }

/**
 * Where the user works as `role`: the district and block of that role's first area
 * (empty for a statewide area). A village / GP area gets the block and district above it.
 */
export async function userScope(userId: number, role: string): Promise<UserScope> {
  const r = await one<Row>(
    `SELECT d.lgd_code AS district_lgd, d.name_hi AS district_hi, d.name_en AS district_en,
            b.lgd_code AS block_lgd, b.name_hi AS block_hi, b.name_en AS block_en
     FROM master_user_assignments a
     LEFT JOIN master_villages v ON a.area_level = 'village' AND v.id = a.area_id
     LEFT JOIN master_gram_panchayats gp ON gp.id = CASE a.area_level
         WHEN 'gram_panchayat' THEN a.area_id WHEN 'village' THEN v.gram_panchayat_id END
     LEFT JOIN master_blocks b ON b.id = CASE a.area_level
         WHEN 'block' THEN a.area_id ELSE gp.block_id END
     LEFT JOIN master_districts d ON d.id = CASE a.area_level
         WHEN 'district' THEN a.area_id ELSE b.district_id END
     WHERE a.user_id = ? AND a.role = ?
     ORDER BY FIELD(a.area_level, 'state', 'district', 'block', 'gram_panchayat', 'village'), a.id
     LIMIT 1`,
    [userId, role],
  )
  return {
    districtLgd: r?.district_lgd ?? null,
    districtHi: r?.district_hi ?? null,
    districtEn: r?.district_en ?? null,
    blockLgd: r?.block_lgd ?? null,
    blockHi: r?.block_hi ?? null,
    blockEn: r?.block_en ?? null,
  }
}

export async function toPublicUser(user: UserFields | Row): Promise<PublicUser> {
  const assignments = await assignmentsOf(user.id)
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    roles: rolesOf(assignments),
    designation: user.designation,
    initials: initials(null, user.name),
    scope: await userScope(user.id, user.role),
    assignments: assignments.map((a) => ({
      role: a.role,
      level: a.level,
      areaCode: a.areaCode,
      areaName: a.areaName,
      departmentCode: a.departmentCode,
      departmentName: a.departmentName,
    })),
  }
}

/** Checks `role` is one the user holds; returns the role the session will use. */
export async function sessionRole(userId: number, primary: Role, role?: string): Promise<Role> {
  // A Didi account is always a Didi, whichever card was picked.
  if (primary === "didi") return "didi"
  const roles = rolesOf(await assignmentsOf(userId))
  if (!role) return roles[0] ?? primary
  if (!roles.includes(role as Role))
    throw new HttpError(403, msg("आपको यह भूमिका नहीं दी गई है। एडमिन से संपर्क करें।"))
  return role as Role
}

/** Switches the current session to another of the user's roles. */
export async function switchRole(token: string, user: SessionUser, role: string) {
  const next = await sessionRole(user.id, user.role, role)
  await exec("UPDATE tbl_user_sessions SET role = ? WHERE token_hash = ?", [next, sha256(token)])
  return toPublicUser({ ...user, role: next })
}

/** Creates an OTP for a registered, active mobile. Returns the code only in dev mode. */
export async function requestOtp(mobile: string) {
  const user = await one<Row>("SELECT id, status FROM master_users WHERE mobile = ?", [mobile])
  if (!user) throw new HttpError(404, msg("यह मोबाइल नंबर पंजीकृत नहीं है"))
  if (user.status === "locked")
    throw new HttpError(403, msg("यह खाता लॉक है। एडमिन से संपर्क करें।"))

  const recent = await one<Row>(
    "SELECT COUNT(*) AS n FROM tbl_otp_requests WHERE mobile = ? AND created_at > NOW() - INTERVAL 15 MINUTE",
    [mobile],
  )
  if ((recent?.n ?? 0) >= config.otpRequestsPer15Min)
    throw new HttpError(429, msg("बहुत अधिक प्रयास। 15 मिनट बाद पुनः प्रयास करें।"))

  const otp = String(crypto.randomInt(100000, 1000000))
  await exec(
    "INSERT INTO tbl_otp_requests (mobile, otp_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL ? MINUTE)",
    [mobile, otpHash(mobile, otp), config.otpTtlMinutes],
  )
  // Production: send `otp` through the SMS gateway here.
  return {
    maskedMobile: maskMobile(mobile),
    expiresIn: config.otpTtlMinutes * 60,
    devOtp: config.otpDevMode ? otp : undefined,
  }
}

/** Checks the latest OTP; on success creates a session and returns its token. */
export async function verifyOtp(mobile: string, otp: string, role?: string) {
  const request = await one<Row>(
    `SELECT id, otp_hash, attempts FROM tbl_otp_requests
     WHERE mobile = ? AND consumed_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [mobile],
  )
  if (!request) throw new HttpError(400, msg("OTP की समय-सीमा समाप्त। नया OTP भेजें।"))
  if (request.attempts >= config.otpMaxAttempts)
    throw new HttpError(429, msg("बहुत अधिक गलत प्रयास। नया OTP भेजें।"))

  const matches = crypto.timingSafeEqual(
    Buffer.from(request.otp_hash, "hex"),
    Buffer.from(otpHash(mobile, otp), "hex"),
  )
  if (!matches) {
    await exec("UPDATE tbl_otp_requests SET attempts = attempts + 1 WHERE id = ?", [request.id])
    const left = config.otpMaxAttempts - request.attempts - 1
    throw new HttpError(401, msg("गलत OTP। {{left}} प्रयास शेष।", { left }))
  }

  const user = await one<Row>(
    "SELECT id, name, role, designation, mobile, status FROM master_users WHERE mobile = ?",
    [mobile],
  )
  if (!user || user.status !== "active") throw new HttpError(403, msg("यह खाता लॉक है।"))
  const active = await sessionRole(user.id, user.role, role)

  const token = crypto.randomBytes(32).toString("hex")
  await transaction(async (conn) => {
    await exec("UPDATE tbl_otp_requests SET consumed_at = NOW() WHERE id = ?", [request.id], conn)
    await exec(
      "INSERT INTO tbl_user_sessions (user_id, role, token_hash, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL ? HOUR)",
      [user.id, active, sha256(token), config.sessionHours],
      conn,
    )
    await exec("UPDATE master_users SET last_login_at = NOW() WHERE id = ?", [user.id], conn)
  })
  return { token, user: { ...user, role: active } as Row }
}

export const revokeSession = (token: string) =>
  exec("UPDATE tbl_user_sessions SET revoked_at = NOW() WHERE token_hash = ?", [sha256(token)])

/** Ends every open session for a user (lock / OTP reset). */
export const revokeUserSessions = (userId: number) =>
  exec("UPDATE tbl_user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [
    userId,
  ])
