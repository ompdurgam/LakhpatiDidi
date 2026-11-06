import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { ConvergenceDetails } from "@/features/survey/sections/schemes/ConvergenceDetails"
import { SaturationSchemeCard } from "@/features/survey/sections/schemes/SaturationSchemeCard"
import { schemeGroups } from "@/features/survey/sections/schemes/schemeGroups"
import { useTr } from "@/i18n/tr"

export function SchemeSaturationForm() {
  const tr = useTr()
  return (
    <div className="section-form scheme-saturation">
      <div className="scheme-rule-note">
        <Icon name="alert" size={16} />
        <span>
          {tr("परिवार-स्तर योजना:")} <b>1/0</b>
          {tr("; व्यक्ति-स्तर:")} <b>{tr("सदस्य संख्या")}</b>
          {tr("; लाभ प्राप्त ≤ पात्र")}
        </span>
      </div>
      <div className="scheme-groups">
        {schemeGroups.map((group, index) => (
          <SchemeDepartmentGroup key={group.department} {...group} initiallyOpen={index === 0} />
        ))}
      </div>
      <ConvergenceDetails />
      <div className="scheme-summary">
        <div>
          <span className="status green">{tr("प्राप्त")}</span>
          <strong>22</strong>
        </div>
        <div>
          <span className="status amber">{tr("लंबित")}</span>
          <strong>3</strong>
        </div>
        <div>
          <span className="status red">{tr("गैप")}</span>
          <strong className="red-number">6</strong>
        </div>
      </div>
    </div>
  )
}

export function SchemeDepartmentGroup({
  department,
  schemes,
  initiallyOpen,
}: {
  department: string
  schemes: string[]
  initiallyOpen: boolean
}) {
  const tr = useTr()
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <section className="scheme-department">
      <button className="department-toggle" onClick={() => setOpen(!open)}>
        <span>
          <Icon name="building" size={15} />
        </span>
        <strong>{tr(department)}</strong>
        <small>
          {schemes.length} {tr("योजनाएँ")}
        </small>
        <b>{open ? "−" : "+"}</b>
      </button>
      {open && (
        <div className="department-schemes">
          {schemes.map((scheme, index) => (
            <SaturationSchemeCard
              key={scheme}
              scheme={scheme}
              department={department}
              initialStatus={
                index % 4 === 0 ? "आवेदन नहीं" : index % 3 === 0 ? "आवेदन लंबित" : "प्राप्त"
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
