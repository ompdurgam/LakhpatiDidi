import { useEffect } from "react"
import { Navigate, useNavigate, useParams } from "react-router"

import { useApplications } from "@/api/hooks"
import { DEFAULT_DEPARTMENT } from "@/app/navigation"
import { departmentByCode } from "@/data/departments"
import { useFilteredApplications } from "@/features/applications/useFilteredApplications"
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

/** /dept/:deptCode/applications/:id — same page with the application drawer open. */
export function DepartmentApplicationPage() {
  const { id } = useParams()
  const { data: applications } = useApplications()
  const openApplication = useUi((s) => s.openApplication)
  const row = applications?.find((a) => a.id === id)
  useEffect(() => {
    if (row) openApplication(row)
  }, [row, openApplication])
  return <DepartmentPage />
}

export const DepartmentIndexRedirect = () => <Navigate to={`/dept/${DEFAULT_DEPARTMENT}`} replace />
