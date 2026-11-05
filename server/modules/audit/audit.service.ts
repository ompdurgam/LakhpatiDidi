import type { Request } from "express"

import { type Db, exec } from "../../db/pool.ts"
import type { SessionUser } from "../../shared/types.ts"

export type AuditEntry = {
  action: string
  details: string
  entityType?: string | null
  entityId?: string | null
}

/** Writes one tbl_audit_logs row for the current request's user and IP. */
export async function audit(req: Request, entry: AuditEntry, db?: Db) {
  const user = req.res?.locals.user as SessionUser | undefined
  await exec(
    `INSERT INTO tbl_audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user?.id ?? null,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      entry.details.slice(0, 500),
      req.ip ?? null,
    ],
    db,
  )
}
