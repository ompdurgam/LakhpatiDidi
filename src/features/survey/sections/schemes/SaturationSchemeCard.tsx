import { useState } from "react"

import { ChipGroup } from "@/components/ui/ChipGroup"
import { NumberControl } from "@/components/ui/NumberStepper"
import { TextControl } from "@/components/ui/TextControl"

export function SaturationSchemeCard({
  scheme,
  department,
  initialStatus,
}: {
  scheme: string
  department: string
  initialStatus: string
}) {
  const [eligible, setEligible] = useState(
    scheme.includes("पेंशन") ? 1 : scheme === "मनरेगा जॉब कार्ड" ? 1 : 2,
  )
  const [benefited, setBenefited] = useState(initialStatus === "प्राप्त" ? 1 : 0)
  const [status, setStatus] = useState(initialStatus)
  const [aware, setAware] = useState("हाँ")
  const changeEligible = (value: number) => {
    const next = Math.max(0, value)
    setEligible(next)
    if (benefited > next) setBenefited(next)
  }
  return (
    <article className="saturation-card">
      <div className="saturation-title">
        <div>
          <strong>{scheme}</strong>
          <span>{department}</span>
        </div>
        <span
          className={`status ${
            status === "प्राप्त" ? "green" : status === "आवेदन लंबित" ? "amber" : "red"
          }`}
        >
          {status === "प्राप्त" ? "प्राप्त ✓" : status}
        </span>
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
        <span>स्थिति</span>
        {["प्राप्त", "आवेदन लंबित", "आवेदन नहीं"].map((option) => (
          <button
            key={option}
            className={`${status === option ? "selected" : ""} ${
              option === "प्राप्त" ? "green" : option === "आवेदन लंबित" ? "amber" : "red"
            }`}
            onClick={() => setStatus(option)}
          >
            {option}
            {option === "प्राप्त" && " ✓"}
          </button>
        ))}
      </div>
      <div className="awareness-control">
        <span>जानकारी है?</span>
        <ChipGroup options={["हाँ", "नहीं"]} selected={[aware]} onToggle={setAware} single />
      </div>
      {scheme === "मनरेगा जॉब कार्ड" && (
        <div className="mgnrega-extra">
          <TextControl label="जॉब कार्ड नंबर" value="CG-04-006-021-00123" />
          <div className="quarter-wages">
            <TextControl label="Q1 मजदूरी ₹" value="8,400" type="number" />
            <TextControl label="Q2 मजदूरी ₹" value="6,800" type="number" />
            <TextControl label="Q3 मजदूरी ₹" value="7,200" type="number" />
          </div>
        </div>
      )}
    </article>
  )
}
