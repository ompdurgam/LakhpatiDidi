import { create } from "zustand"

import type { ApplicationRow } from "@/api/types"

type UiState = {
  toast: string
  /** Header search box; filters application lists. */
  query: string
  menuOpen: boolean
  /** Application shown in the right-hand drawer. */
  selectedApplication: ApplicationRow | null
  notify: (message: string) => void
  setQuery: (query: string) => void
  setMenuOpen: (open: boolean) => void
  openApplication: (row: ApplicationRow | null) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

/** Transient UI state shared by the shell and pages. */
export const useUi = create<UiState>()((set) => ({
  toast: "",
  query: "",
  menuOpen: false,
  selectedApplication: null,
  notify: (message) => {
    clearTimeout(toastTimer)
    set({ toast: message })
    toastTimer = setTimeout(() => set({ toast: "" }), 2600)
  },
  setQuery: (query) => set({ query }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  openApplication: (selectedApplication) => set({ selectedApplication }),
}))
