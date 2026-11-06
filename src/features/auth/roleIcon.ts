import type { IconName } from "@/components/ui/Icon"
import type { Role } from "@/stores/session"

/** Icon per role (role cards and the selected-role chip). */
export const roleIcon: Record<Role, IconName> = {
  field: "people",
  block: "home",
  department: "building",
  district: "map",
  state: "chart",
  admin: "settings",
  didi: "user",
}
