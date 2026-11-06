import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import type { DprData } from "./types"

/** Step 1 — who the Didi is (all from her survey, read-only). */
export function BeneficiaryStep({ data }: { data: DprData }) {
  const tr = useTr()
  const h = data.household
  const rows: [string, string, boolean?][] = [
    [tr("लाभार्थी नाम"), h.name],
    [tr("पिता / पति"), h.guardian ?? "–"],
    [tr("मोबाइल"), h.mobile],
    [tr("कोड"), h.code],
    [tr("SHG / VO"), [h.shg, h.vo].filter(Boolean).join(" / ") || "–"],
    [tr("सामाजिक वर्ग"), h.category],
    [tr("विशेष समुदाय"), h.special ?? "–"],
    [tr("पूरा पता"), `${h.village}, GP ${h.panchayat}, ${h.block}, ${h.district}`, true],
  ]
  return (
    <div className="dpr-fields">
      {rows.map(([label, value, full]) => (
        <label key={label} className={full ? "full-field" : ""}>
          <span>
            {label} <small>{tr("सर्वे से")}</small>
          </span>
          <div className="dpr-locked">
            <span>{value}</span>
          </div>
        </label>
      ))}
    </div>
  )
}

/** Step 2 — the scheme and why it fits. */
export function ProjectStep({ data }: { data: DprData }) {
  const tr = useTr()
  const { scheme, fit } = data
  const rows: [string, string][] = [
    [tr("योजना"), scheme.name],
    [tr("विभाग"), scheme.department],
    [tr("आवेदन कहाँ"), scheme.office],
    [tr("अनुदान"), `${scheme.subsidyPercent}%`],
    [tr("उपयुक्तता"), `${fit.score}%`],
    [tr("स्वीकृति समय"), tr("{{n}} दिन", { n: scheme.slaDays })],
  ]
  return (
    <>
      <div className="dpr-fields">
        {rows.map(([label, value]) => (
          <label key={label}>
            <span>{label}</span>
            <div>{value}</div>
          </label>
        ))}
        <label className="full-field">
          <span>{tr("यह योजना क्यों")}</span>
          <div>{fit.why}</div>
        </label>
      </div>
    </>
  )
}

/** Step 5 — papers collected; the list comes from the scheme's rule. */
export function DocumentsStep({
  docs,
  have,
  onToggle,
}: {
  docs: string[]
  have: string[]
  onToggle: (doc: string) => void
}) {
  const tr = useTr()
  return (
    <div className="document-grid">
      {docs.map((doc) => {
        const ok = have.includes(doc)
        return (
          <button
            key={doc}
            type="button"
            className={ok ? "" : "missing"}
            aria-pressed={ok}
            onClick={() => onToggle(doc)}
          >
            <span className="document-status">
              <Icon name={ok ? "check" : "alert"} size={15} />
            </span>
            <span>{doc}</span>
            <small>{ok ? tr("प्राप्त") : tr("दस्तावेज़ जोड़ें")}</small>
          </button>
        )
      })}
    </div>
  )
}

/** Step 6 — eligibility checks (confirmed vs. still to verify) and the surveyor's remarks. */
export function VerifyStep({
  checks,
  remarks,
  onRemarks,
}: {
  checks: DprData["fit"]["checks"]
  remarks: string
  onRemarks: (value: string) => void
}) {
  const tr = useTr()
  return (
    <div className="verification-step">
      {checks.map(([ok, text]) => (
        <div className={`verification-card ${ok ? "" : "pending"}`} key={text}>
          <span>
            <Icon name={ok ? "check" : "alert"} size={17} />
          </span>
          <div>
            <strong>{text}</strong>
            <small>{ok ? tr("सर्वे डेटा से पुष्ट") : tr("फील्ड पर सत्यापन करें")}</small>
          </div>
        </div>
      ))}
      <label className="verification-remarks">
        <span>{tr("सत्यापन टिप्पणी")}</span>
        <textarea
          value={remarks}
          maxLength={500}
          onChange={(event) => onRemarks(event.target.value)}
        />
      </label>
    </div>
  )
}
