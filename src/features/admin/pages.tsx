import { Navigate, useParams } from "react-router"

import { useUi } from "@/stores/ui"

import { AdminWorkspace } from "./AdminWorkspace"

export const ADMIN_MODULES = [
  "schemes",
  "mapping",
  "users",
  "geography",
  "survey",
  "village",
  "audit",
]

/** /admin/:module — admin workspace with the matching tab selected. */
export function AdminPage() {
  const { module } = useParams()
  const notify = useUi((s) => s.notify)
  if (!module || !ADMIN_MODULES.includes(module)) return <Navigate to="/admin/schemes" replace />
  return <AdminWorkspace onNotify={notify} />
}
