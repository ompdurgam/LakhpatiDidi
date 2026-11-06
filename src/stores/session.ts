import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { User } from "@/api/types"

export type Role = "field" | "block" | "department" | "district" | "state" | "admin" | "didi"

/** Every login role, in the order the login screen lists them. */
export const ROLES: Role[] = ["field", "block", "department", "district", "state", "admin", "didi"]

/** Roles a signed-in staff member can switch between (a Didi only ever sees her own profile). */
export const STAFF_ROLES: Role[] = ROLES.filter((role) => role !== "didi")

type SessionState = {
  token: string | null
  user: User | null
  /** Role chosen on the login screen / header switcher (the design allows switching). */
  role: Role
  signIn: (token: string, user: User, role: Role) => void
  setRole: (role: Role) => void
  signOut: () => void
}

/** Session + auth state. Server data lives in React Query, not here. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: "block",
      signIn: (token, user, role) => set({ token, user, role }),
      setRole: (role) => set({ role }),
      signOut: () => set({ token: null, user: null }),
    }),
    {
      name: "ld.session",
      storage: createJSONStorage(() => {
        try {
          return localStorage
        } catch {
          return sessionStorage
        }
      }),
    },
  ),
)

export const isRole = (value: string | undefined): value is Role => ROLES.includes(value as Role)
