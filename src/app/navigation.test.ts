import { describe, expect, it } from "vitest"

import hiNav from "@/i18n/locales/hi/nav.json"
import { ROLES } from "@/stores/session"

import { navForRole, roleHome, roleNav } from "./navigation"

describe("navigation", () => {
  it("gives every role a home page", () => {
    expect(ROLES.map(roleHome)).toEqual([
      "/field",
      "/block",
      "/dept/FISH",
      "/district",
      "/state",
      "/admin/schemes",
    ])
  })

  it("has a Hindi label for every menu item", () => {
    for (const items of Object.values(roleNav)) {
      for (const item of items) {
        const [role, key] = item.label.split(".") as [keyof typeof hiNav, string]
        expect((hiNav[role] as Record<string, string>)[key]).toBeTruthy()
      }
    }
  })

  it("points department links at the department being viewed", () => {
    const paths = navForRole("department", "AH").map((i) => i.path)
    expect(paths[0]).toBe("/dept/AH")
    expect(paths.every((p) => p.startsWith("/dept/AH"))).toBe(true)
  })

  it("leaves other roles unchanged", () => {
    expect(navForRole("block", "AH")).toBe(roleNav.block)
  })
})
