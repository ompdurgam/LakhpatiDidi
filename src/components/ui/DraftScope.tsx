import { type ReactNode, useContext } from "react"

import { DraftScopeContext } from "./draft"

/** Answers inside are stored as "<scope> • <label>" (scopes nest). */
export function DraftScope({ name, children }: { name: string; children: ReactNode }) {
  const parent = useContext(DraftScopeContext)
  return (
    <DraftScopeContext.Provider value={parent ? `${parent} • ${name}` : name}>
      {children}
    </DraftScopeContext.Provider>
  )
}
