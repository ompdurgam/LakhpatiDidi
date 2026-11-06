import type { ReactNode } from "react"

import { useTr } from "@/i18n/tr"

export function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  const tr = useTr()
  return (
    <section className="form-group">
      <h4>{tr(title)}</h4>
      {children}
    </section>
  )
}
