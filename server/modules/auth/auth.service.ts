import crypto from "node:crypto"

import { config } from "../../config.ts"
import { exec, one, transaction } from "../../db/pool.ts"
import { HttpError } from "../../shared/errors.ts"
import { initials, maskMobile, sha256 } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"

const otpHash = (mobile: string, otp: string) => sha256(`${mobile}:${otp}`)

export type PublicUser = {
  id: number
  name: string
  role: string
  designation: string
  initials: string
}

type UserFields = { id: number; name: string; role: string; designation: string }

export const toPublicUser = (user: UserFields | Row): PublicUser => ({
  id: user.id,
  name: user.name,
  role: user.role,
  designation: user.designation,
  initials: initials(null, user.name),
})

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
export async function verifyOtp(mobile: string, otp: string) {
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

  const token = crypto.randomBytes(32).toString("hex")
  await transaction(async (conn) => {
    await exec("UPDATE tbl_otp_requests SET consumed_at = NOW() WHERE id = ?", [request.id], conn)
    await exec(
      "INSERT INTO tbl_user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL ? HOUR)",
      [user.id, sha256(token), config.sessionHours],
      conn,
    )
    await exec("UPDATE master_users SET last_login_at = NOW() WHERE id = ?", [user.id], conn)
  })
  return { token, user }
}

export const revokeSession = (token: string) =>
  exec("UPDATE tbl_user_sessions SET revoked_at = NOW() WHERE token_hash = ?", [sha256(token)])

/** Ends every open session for a user (lock / OTP reset). */
export const revokeUserSessions = (userId: number) =>
  exec("UPDATE tbl_user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [
    userId,
  ])
