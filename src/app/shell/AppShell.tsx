import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useMatch, useNavigate } from "react-router"

import { useData } from "@/api/hooks"
import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { Toast } from "@/components/ui/Toast"
import { ApplicationDrawer } from "@/features/applications/ApplicationDrawer"
import { useSession } from "@/stores/session"
import { useUi } from "@/stores/ui"

import { BottomTabs } from "./BottomTabs"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

/** Sidebar + header frame around every signed-in page. */
export function AppShell() {
  const { t } = useTranslation()
  const { error } = useData()
  const role = useSession((s) => s.role)
  const selected = useUi((s) => s.selectedApplication)
  const openApplication = useUi((s) => s.openApplication)
  const notify = useUi((s) => s.notify)
  const menuOpen = useUi((s) => s.menuOpen)
  const setMenuOpen = useUi((s) => s.setMenuOpen)
  const navigate = useNavigate()
  const deptApplication = useMatch("/dept/:deptCode/applications/:id")
  const closeDrawer = () => {
    openApplication(null)
    // Leave the application URL so a reload doesn't reopen it.
    if (deptApplication) navigate(`/dept/${deptApplication.params.deptCode}`)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main>
        <Header />
        {error && (
          <div className="api-banner" role="alert">
            <Icon name="alert" size={16} /> {error}
          </div>
        )}
        <Suspense fallback={<EmptyState>{t("status.loading")}</EmptyState>}>
          <Outlet />
        </Suspense>
      </main>
      {selected && (
        <ApplicationDrawer item={selected} role={role} onClose={closeDrawer} onNotify={notify} />
      )}
      <BottomTabs />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
      <Toast />
    </div>
  )
}
