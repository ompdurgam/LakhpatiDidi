import type { Role } from "@/stores/session"

/**
 * Seeded demo mobile per role (database/seeds/001_demo_data.sql). Used only in
 * development to prefill the mobile step; production starts empty.
 */
export const demoMobile: Record<Role, string> = {
  block: "9826143412",
  field: "9752314412",
  department: "9425118881",
  district: "9301245176",
  state: "9993000101",
  admin: "9993000001",
  didi: "9826100123", // Sunita Kashyap, HH-BST-JGD-000123
}
