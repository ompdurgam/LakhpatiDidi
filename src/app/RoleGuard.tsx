import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"

import { type Role, useSession } from "@/stores/session"

import { roleHome } from "./navigation"

/**
 * Signed-in check, plus (when `role` is given) a check that the URL belongs
 * to the role the user is working as. Other roles are reached through the
 * header role switcher, as in the prototype.
 */
export function RoleGuard({ role, children }: { role?: Role; children: ReactNode }) {
  const token = useSession((s) => s.token)
  const current = useSession((s) => s.role)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && role !== current) return <Navigate to={roleHome(current)} replace />
  return <>{children}</>
}
