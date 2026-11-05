import { Router } from "express"

import { query } from "../../db/pool.ts"
import { dateHi } from "../../shared/format.ts"
import type { Row } from "../../shared/types.ts"

const LIMIT = 200

export const auditLogsRouter = Router()

auditLogsRouter.get("/", async (_req, res) => {
  const rows = await query<Row>(
    `SELECT l.id, l.created_at, COALESCE(u.name, 'सिस्टम') AS user, l.action, l.details, l.ip_address
     FROM tbl_audit_logs l LEFT JOIN master_users u ON u.id = l.user_id
     ORDER BY l.created_at DESC, l.id DESC LIMIT ?`,
    [LIMIT],
  )
  res.json(
    rows.map((r) => ({
      id: r.id,
      at: dateHi(r.created_at, true),
      user: r.user,
      action: r.action,
      details: r.details,
      ip: r.ip_address ?? "—",
    })),
  )
})
