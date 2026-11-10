import type { ComponentType } from "react"
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from "react-router"

import { type Role, useSession } from "@/stores/session"

import { BootScreen } from "./BootScreen"
import { roleHome } from "./navigation"
import { RoleGuard } from "./RoleGuard"
import { NotFound, RouteError } from "./RouteError"
import { AppShell } from "./shell/AppShell"

// Each feature's pages module is its own chunk, loaded on first visit.
const block = () => import("@/features/block/pages")
const field = () => import("@/features/survey/pages")
const dept = () => import("@/features/department/pages")
const monitoring = () => import("@/features/monitoring/pages")
const admin = () => import("@/features/admin/pages")
const geo = () => import("@/features/geo/pages")
const didi = () => import("@/features/didi/pages")

const page = <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType) => ({
  lazy: async () => ({ Component: pick(await load()) }),
})

const guarded = (role: Role, children: RouteObject[]): RouteObject => ({
  element: (
    <RoleGuard role={role}>
      <Outlet />
    </RoleGuard>
  ),
  children,
})

function Home() {
  const role = useSession((s) => s.role)
  return <Navigate to={roleHome(role)} replace />
}

const fieldPage = page(field, (m) => m.FieldPage)
const districtPage = page(monitoring, (m) => m.DistrictPage)
const statePage = page(monitoring, (m) => m.StatePage)
const deptPage = page(dept, (m) => m.DepartmentPage)

export const routes: RouteObject[] = [
  {
    path: "/login",
    lazy: async () => ({ Component: (await import("@/features/auth/LoginScreen")).LoginScreen }),
    errorElement: <RouteError />,
    hydrateFallbackElement: <BootScreen />,
  },
  {
    path: "/",
    element: (
      <RoleGuard>
        <AppShell />
      </RoleGuard>
    ),
    errorElement: <RouteError />,
    hydrateFallbackElement: <BootScreen />,
    children: [
      { index: true, element: <Home /> },
      guarded("block", [
        { path: "block", ...page(block, (m) => m.BlockOverviewPage) },
        { path: "block/households", ...page(block, (m) => m.BlockHouseholdsPage) },
        { path: "block/applications", ...page(block, (m) => m.BlockApplicationsPage) },
        { path: "block/blcc", ...page(block, (m) => m.BlockBlccPage) },
        { path: "block/schemes", ...page(block, (m) => m.BlockSchemesPage) },
        { path: "block/reports", ...page(block, (m) => m.BlockReportsPage) },
        { path: "block/map/:level?/:code?", ...page(geo, (m) => m.BlockMapPage) },
      ]),
      guarded("field", [
        { path: "field", ...fieldPage },
        { path: "field/survey/:householdId?/:section?", ...fieldPage },
        { path: "field/village/:villageId?", ...fieldPage },
        { path: "field/households/:id?", ...fieldPage },
        { path: "field/recommendations/:householdId?", ...fieldPage },
        { path: "field/dpr/:householdId?/:schemeCode?", ...fieldPage },
        { path: "field/income", ...fieldPage },
      ]),
      guarded("department", [
        { path: "dept", ...page(dept, (m) => m.DepartmentIndexRedirect) },
        { path: "dept/:deptCode", ...deptPage },
        {
          path: "dept/:deptCode/applications/:id",
          ...page(dept, (m) => m.DepartmentApplicationPage),
        },
        // sanctioned / delivery / escalations / schemes / reports (phase 4)
        { path: "dept/:deptCode/:view", ...deptPage },
      ]),
      guarded("district", [
        { path: "district", ...districtPage },
        { path: "district/blocks/:blockId?", ...districtPage },
        { path: "district/departments", ...districtPage },
        { path: "district/lakhpati-gram", ...districtPage },
        { path: "district/escalations", ...districtPage },
        { path: "district/reports", ...districtPage },
        { path: "district/map/:level?/:code?", ...page(geo, (m) => m.DistrictMapPage) },
      ]),
      guarded("state", [
        { path: "state", ...statePage },
        { path: "state/districts/:districtId?", ...statePage },
        { path: "state/departments", ...statePage },
        { path: "state/certification", ...statePage },
        { path: "state/escalations", ...statePage },
        { path: "state/reports", ...statePage },
        { path: "state/map/:level?/:code?", ...page(geo, (m) => m.StateMapPage) },
      ]),
      guarded("didi", [
        { path: "didi", ...page(didi, (m) => m.DidiProfilePage) },
        { path: "didi/tasks", ...page(didi, (m) => m.DidiTasksPage) },
        { path: "didi/schemes", ...page(didi, (m) => m.DidiSchemesPage) },
        { path: "didi/applications", ...page(didi, (m) => m.DidiApplicationsPage) },
      ]),
      guarded("admin", [
        { path: "admin", element: <Navigate to="/admin/schemes" replace /> },
        { path: "admin/:module", ...page(admin, (m) => m.AdminPage) },
      ]),
      { path: "settings", ...page(block, (m) => m.SettingsPage) },
      { path: "*", element: <NotFound /> },
    ],
  },
]

export const createRouter = () => createBrowserRouter(routes)
