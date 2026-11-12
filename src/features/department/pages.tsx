import { Navigate, useNavigate, useParams } from "react-router"

import { DEFAULT_DEPARTMENT } from "@/app/navigation"
import { departmentByCode } from "@/data/departments"
import { ApplicationPage } from "@/features/applications/ApplicationPage"
import { useFilteredApplications } from "@/features/applications/useFilteredApplications"
import { useSession } from "@/stores/session"
import { useUi } from "@/stores/ui"

import { DepartmentWorkspace } from "./DepartmentDashboard"

/** /dept/:deptCode — dashboard + inbox for one line department. */
export function DepartmentPage() {
  const { deptCode } = useParams()
  const navigate = useNavigate()
  const rows = useFilteredApplications()
  const notify = useUi((s) => s.notify)
  if (!departmentByCode(deptCode)) return <Navigate to={`/dept/${DEFAULT_DEPARTMENT}`} replace />
  return (
    <DepartmentWorkspace
      rows={rows}
      onSelect={(row) => navigate(`/dept/${deptCode}/applications/${row.id}`)}
      onNotify={notify}
    />
  )
}

/** /dept/:deptCode/applications/:id — the application on its own page, with its track bar. */
export function DepartmentApplicationPage() {
  const { deptCode, id } = useParams()
  const navigate = useNavigate()
  const role = useSession((s) => s.role)
  const notify = useUi((s) => s.notify)
  return (
    <ApplicationPage
      key={id}
      code={id ?? ""}
      role={role}
      onBack={() => navigate(`/dept/${deptCode}`)}
      onNotify={notify}
    />
  )
}

export const DepartmentIndexRedirect = () => <Navigate to={`/dept/${DEFAULT_DEPARTMENT}`} replace />
