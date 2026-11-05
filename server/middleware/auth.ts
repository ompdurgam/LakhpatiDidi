import type { NextFunction, Request, Response } from "express"

import { one } from "../db/pool.ts"
import { HttpError } from "../shared/errors.ts"
import { sha256 } from "../shared/format.ts"
import type { SessionUser } from "../shared/types.ts"

export const bearerToken = (req: Request) =>
  req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? ""

/** Resolves the bearer token to an active user, or responds 401. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req)
  if (!token) return next(new HttpError(401, "लॉगिन आवश्यक है"))
  const user = await one<SessionUser & { [key: string]: unknown }>(
    `SELECT u.id, u.name, u.role, u.designation, u.mobile
     FROM tbl_user_sessions s JOIN master_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW() AND u.status = 'active'`,
    [sha256(token)],
  )
  if (!user) return next(new HttpError(401, "सत्र समाप्त। फिर से लॉगिन करें।"))
  res.locals.user = user
  next()
}

/** The signed-in user for a route behind requireAuth. */
export const currentUser = (res: Response) => res.locals.user as SessionUser
