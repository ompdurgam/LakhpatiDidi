import type { ReactNode } from "react"

export function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="form-group">
      <h4>{title}</h4>
      {children}
    </section>
  )
}
