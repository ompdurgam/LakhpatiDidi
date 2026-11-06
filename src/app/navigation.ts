import type { IconName } from "@/components/ui/Icon"
import type navLabels from "@/i18n/locales/hi/nav.json"
import type { Role } from "@/stores/session"

type NavLabels = typeof navLabels
/** Dotted key into the nav namespace, e.g. "block.overview". */
export type NavLabel = {
  [R in keyof NavLabels]: `${R}.${keyof NavLabels[R] & string}`
}[keyof NavLabels]

export type NavItem = {
  icon: IconName
  /** i18n key in the `nav` namespace */
  label: NavLabel
  path: string
  /** Match only the exact path (used for role home pages). */
  end?: boolean
  /** Show the open-applications counter. */
  badge?: boolean
}

export const DEFAULT_DEPARTMENT = "FISH"

/** Sidebar menu per role (same items as the Figma prototype). */
export const roleNav: Record<Role, NavItem[]> = {
  block: [
    { icon: "home", label: "block.overview", path: "/block", end: true },
    { icon: "people", label: "block.households", path: "/block/households" },
    { icon: "file", label: "block.applications", path: "/block/applications", badge: true },
    { icon: "building", label: "block.blcc", path: "/block/blcc" },
    { icon: "scheme", label: "block.schemes", path: "/block/schemes" },
    { icon: "chart", label: "block.reports", path: "/block/reports" },
    { icon: "map", label: "block.map", path: "/block/map" },
  ],
  field: [
    { icon: "home", label: "field.home", path: "/field", end: true },
    { icon: "people", label: "field.households", path: "/field/households" },
    { icon: "file", label: "field.survey", path: "/field/survey" },
    { icon: "scheme", label: "field.recommendations", path: "/field/recommendations" },
    { icon: "trend", label: "field.income", path: "/field/income" },
    { icon: "building", label: "field.village", path: "/field/village" },
  ],
  department: [
    {
      icon: "file",
      label: "department.inbox",
      path: `/dept/${DEFAULT_DEPARTMENT}`,
      end: true,
      badge: true,
    },
    {
      icon: "check",
      label: "department.sanctioned",
      path: `/dept/${DEFAULT_DEPARTMENT}/sanctioned`,
    },
    {
      icon: "building",
      label: "department.delivery",
      path: `/dept/${DEFAULT_DEPARTMENT}/delivery`,
    },
    {
      icon: "alert",
      label: "department.escalations",
      path: `/dept/${DEFAULT_DEPARTMENT}/escalations`,
    },
    { icon: "scheme", label: "department.schemes", path: `/dept/${DEFAULT_DEPARTMENT}/schemes` },
    { icon: "chart", label: "department.reports", path: `/dept/${DEFAULT_DEPARTMENT}/reports` },
  ],
  district: [
    { icon: "home", label: "district.overview", path: "/district", end: true },
    { icon: "map", label: "district.map", path: "/district/map" },
    { icon: "building", label: "district.blocks", path: "/district/blocks" },
    { icon: "building", label: "district.departments", path: "/district/departments" },
    { icon: "check", label: "district.lakhpatiGram", path: "/district/lakhpati-gram" },
    { icon: "alert", label: "district.escalations", path: "/district/escalations" },
    { icon: "chart", label: "district.reports", path: "/district/reports" },
  ],
  state: [
    { icon: "home", label: "state.overview", path: "/state", end: true },
    { icon: "map", label: "state.map", path: "/state/map" },
    { icon: "building", label: "state.districts", path: "/state/districts" },
    { icon: "building", label: "state.departments", path: "/state/departments" },
    { icon: "check", label: "state.certification", path: "/state/certification" },
    { icon: "alert", label: "state.escalations", path: "/state/escalations" },
    { icon: "chart", label: "state.reports", path: "/state/reports" },
  ],
  didi: [
    { icon: "user", label: "didi.profile", path: "/didi", end: true },
    { icon: "file", label: "didi.applications", path: "/didi/applications" },
  ],
  admin: [
    { icon: "scheme", label: "admin.schemes", path: "/admin/schemes" },
    { icon: "people", label: "admin.users", path: "/admin/users" },
    { icon: "map", label: "admin.geography", path: "/admin/geography" },
    { icon: "settings", label: "admin.survey", path: "/admin/survey" },
  ],
}

export const roleHome = (role: Role) => roleNav[role][0].path

/** Department menu links point at the department currently being viewed. */
export function navForRole(role: Role, deptCode?: string): NavItem[] {
  if (role !== "department" || !deptCode) return roleNav[role]
  return roleNav.department.map((item) => ({
    ...item,
    path: item.path.replace(`/dept/${DEFAULT_DEPARTMENT}`, `/dept/${deptCode}`),
  }))
}
