import { useContext, useReducer, useState } from "react"

import { SurveyDraftContext } from "@/components/ui/draft"
import { DraftScope } from "@/components/ui/DraftScope"
import { Icon } from "@/components/ui/Icon"
import { ConvergenceDetails } from "@/features/survey/sections/schemes/ConvergenceDetails"
import { SaturationSchemeCard } from "@/features/survey/sections/schemes/SaturationSchemeCard"
import { schemeGroups } from "@/features/survey/sections/schemes/schemeGroups"
import { useTr } from "@/i18n/tr"

export function SchemeSaturationForm() {
  return (
    <DraftScope name="D">
      <SchemeSaturationBody />
    </DraftScope>
  )
}

function SchemeSaturationBody() {
  const tr = useTr()
  const draft = useContext(SurveyDraftContext)
  // Recount whenever a scheme's status changes (the cards save into the draft).
  const [, recount] = useReducer((n: number) => n + 1, 0)
  const statuses = Object.entries(draft ?? {})
    .filter(([key]) => key.startsWith("D • ") && key.endsWith(" • स्थिति"))
    .map(([, value]) => value)
  const count = (status: string) => statuses.filter((s) => s === status).length
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
          <SchemeDepartmentGroup
            key={group.department}
            {...group}
            initiallyOpen={index === 0}
            onChange={recount}
          />
        ))}
      </div>
      <ConvergenceDetails />
      <div className="scheme-summary">
        <div>
          <span className="status green">{tr("प्राप्त")}</span>
          <strong>{count("प्राप्त")}</strong>
        </div>
        <div>
          <span className="status amber">{tr("लंबित")}</span>
          <strong>{count("आवेदन लंबित")}</strong>
        </div>
        <div>
          <span className="status red">{tr("गैप")}</span>
          <strong className="red-number">{count("आवेदन नहीं")}</strong>
        </div>
      </div>
    </div>
  )
}

export function SchemeDepartmentGroup({
  department,
  schemes,
  initiallyOpen,
  onChange,
}: {
  department: string
  schemes: string[]
  initiallyOpen: boolean
  onChange: () => void
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
          {schemes.map((scheme) => (
            <SaturationSchemeCard
              key={scheme}
              scheme={scheme}
              department={department}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </section>
  )
}
