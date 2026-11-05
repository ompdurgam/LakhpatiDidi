import { useNavigate } from "react-router"

import { useFilteredApplications } from "@/features/applications/useFilteredApplications"
import { BlockDashboard } from "@/features/monitoring/BlockDashboard"
import { useEnglish } from "@/i18n"
import { useSession } from "@/stores/session"
import { useUi } from "@/stores/ui"

import { ModulePage } from "./BlockModulePage"

/** Internal labels the ported ModulePage switches on. */
const sectionLabel = {
  households: "परिवार",
  applications: "आवेदन",
  blcc: "BLCC कार्यवाही",
  schemes: "योजनाएँ",
  reports: "रिपोर्ट",
  settings: "सेटिंग्स",
} as const

export type BlockSection = keyof typeof sectionLabel

export function BlockOverviewPage() {
  const navigate = useNavigate()
  const english = useEnglish()
  const user = useSession((s) => s.user)
  const setRole = useSession((s) => s.setRole)
  const rows = useFilteredApplications()
  const openApplication = useUi((s) => s.openApplication)
  const notify = useUi((s) => s.notify)
  if (!user) return null
  return (
    <BlockDashboard
      english={english}
      user={user}
      rows={rows}
      onSelect={openApplication}
      onNotify={notify}
      go={(section) => navigate(`/block/${section}`)}
      openDepartments={() => {
        setRole("department")
        navigate("/dept")
      }}
    />
  )
}

export function BlockSectionPage({ section }: { section: BlockSection }) {
  const rows = useFilteredApplications()
  const openApplication = useUi((s) => s.openApplication)
  const notify = useUi((s) => s.notify)
  return (
    <ModulePage
      active={sectionLabel[section]}
      rows={rows}
      onSelect={openApplication}
      onNotify={notify}
    />
  )
}

export const BlockHouseholdsPage = () => <BlockSectionPage section="households" />
export const BlockApplicationsPage = () => <BlockSectionPage section="applications" />
export const BlockBlccPage = () => <BlockSectionPage section="blcc" />
export const BlockSchemesPage = () => <BlockSectionPage section="schemes" />
export const BlockReportsPage = () => <BlockSectionPage section="reports" />
export const SettingsPage = () => <BlockSectionPage section="settings" />
