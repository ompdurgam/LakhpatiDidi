import type { RowDataPacket } from "mysql2/promise"

/** A query row. Columns are dynamic; their shape is checked by the SQL. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = RowDataPacket & Record<string, any>

export type Role = "field" | "block" | "department" | "district" | "state" | "admin" | "didi"

/** The signed-in user, attached to res.locals.user by requireAuth. */
export type SessionUser = {
  id: number
  name: string
  role: Role
  designation: string
  mobile: string
}

/** Role names (Hindi where the UI shows Hindi; wrap in msg() for responses). */
export const roleLabels: Record<Role, string> = {
  field: "CRP / Surveyor",
  block: "Block Manager",
  department: "विभाग अधिकारी",
  district: "DPM",
  state: "SMMU",
  admin: "Admin",
  didi: "Didi (PLD)",
}
