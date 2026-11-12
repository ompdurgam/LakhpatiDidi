import { useEffect } from "react"

import { ChipGroup } from "@/components/ui/ChipGroup"
import { useDraftState } from "@/components/ui/draft"
import { DraftScope } from "@/components/ui/DraftScope"
import { NumberControl } from "@/components/ui/NumberStepper"
import { TextControl } from "@/components/ui/TextControl"
import { useTr } from "@/i18n/tr"

const SCHEME_STATUSES = ["प्राप्त", "आवेदन लंबित", "आवेदन नहीं"] as const

type CardProps = {
  scheme: string
  department: string
  /** Called when the status changes, so the section summary can recount. */
  onChange?: () => void
}

/** One entitlement scheme: eligible / benefited members, status and awareness. */
export function SaturationSchemeCard(props: CardProps) {
  // Each scheme keeps its own answers ("D • <scheme> • स्थिति"…).
  return (
    <DraftScope name={props.scheme}>
      <SchemeCardBody {...props} />
    </DraftScope>
  )
}

function SchemeCardBody({ scheme, department, onChange }: CardProps) {
  const tr = useTr()
  const [eligible, setEligible] = useDraftState("पात्र सदस्य", 0)
  const [benefited, setBenefited] = useDraftState("लाभ प्राप्त", 0)
  const [status, setStatus] = useDraftState("स्थिति", "")
  const [aware, setAware] = useDraftState("जानकारी है?", "")
  useEffect(() => onChange?.(), [status, onChange])
  const changeEligible = (value: number) => {
    const next = Math.max(0, value)
    setEligible(next)
    if (benefited > next) setBenefited(next)
  }
  return (
    <article className="saturation-card">
      <div className="saturation-title">
        <div>
          <strong>{tr(scheme)}</strong>
          <span>{tr(department)}</span>
        </div>
        {status && (
          <span
            className={`status ${
              status === "प्राप्त" ? "green" : status === "आवेदन लंबित" ? "amber" : "red"
            }`}
          >
            {status === "प्राप्त" ? `${tr("प्राप्त")} ✓` : tr(status)}
          </span>
        )}
      </div>
      <div className="scheme-steppers">
        <NumberControl label="पात्र सदस्य" value={eligible} onChange={changeEligible} />
        <NumberControl
          label="लाभ प्राप्त"
          value={benefited}
          onChange={(value) => setBenefited(Math.min(eligible, Math.max(0, value)))}
        />
      </div>
      <div className="scheme-status-control">
        <span>{tr("स्थिति")}</span>
        {SCHEME_STATUSES.map((option) => (
          <button
            type="button"
            key={option}
            className={`${status === option ? "selected" : ""} ${
              option === "प्राप्त" ? "green" : option === "आवेदन लंबित" ? "amber" : "red"
            }`}
            onClick={() => setStatus(status === option ? "" : option)}
          >
            {tr(option)}
            {option === "प्राप्त" && " ✓"}
          </button>
        ))}
      </div>
      <div className="awareness-control">
        <span>{tr("जानकारी है?")}</span>
        <ChipGroup
          options={["हाँ", "नहीं"]}
          selected={aware ? [aware] : []}
          onToggle={setAware}
          single
        />
      </div>
      {scheme === "मनरेगा जॉब कार्ड" && (
        <div className="mgnrega-extra">
          <TextControl label="जॉब कार्ड नंबर" value="" />
          <div className="quarter-wages">
            <TextControl label="Q1 मजदूरी ₹" value="" type="number" />
            <TextControl label="Q2 मजदूरी ₹" value="" type="number" />
            <TextControl label="Q3 मजदूरी ₹" value="" type="number" />
          </div>
        </div>
      )}
    </article>
  )
}
