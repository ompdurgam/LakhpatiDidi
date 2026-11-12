import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useDraftState } from "@/components/ui/draft"
import { DraftScope } from "@/components/ui/DraftScope"
import { SelectControl } from "@/components/ui/Select"
import { TextControl } from "@/components/ui/TextControl"
import { useTr } from "@/i18n/tr"

const YES_NO = ["", "हाँ", "नहीं"]
const STATUS = ["", "प्राप्त", "आवेदन लंबित", "प्रशिक्षण पूर्ण", "आवेदन नहीं"]

/** Bank / NRLM loans and other convergence questions (section D). */
export function ConvergenceDetails() {
  const tr = useTr()
  return (
    <section className="convergence-details">
      <h4>{tr("अभिसरण विवरण")}</h4>
      <LoanRow label="बैंक ऋण" />
      <LoanRow label="NRLM ऋण CIF/CEF" />
      {[
        ["IFR पट्टा लाभार्थी", YES_NO],
        ["गाँव में CFR पट्टा", YES_NO],
        ["PMFME लाभ स्थिति", STATUS],
        ["RSETI/DDU-GKY प्रशिक्षण स्थिति", STATUS],
      ].map(([label, options]) => (
        <div className="convergence-select" key={label as string}>
          <SelectControl label={label as string} value="" options={options as string[]} />
        </div>
      ))}
    </section>
  )
}

/** A loan taken or not; amount and year are kept per loan type. */
function LoanRow({ label }: { label: string }) {
  return (
    <DraftScope name={label}>
      <LoanRowBody label={label} />
    </DraftScope>
  )
}

function LoanRowBody({ label }: { label: string }) {
  const [taken, setTaken] = useDraftState("लिया?", "")
  return (
    <div className="convergence-row">
      <ChipField label={label}>
        <ChipGroup
          options={["हाँ", "नहीं"]}
          selected={taken ? [taken] : []}
          onToggle={setTaken}
          single
        />
      </ChipField>
      {taken === "हाँ" && (
        <div className="control-grid">
          <TextControl label="राशि ₹" value="" type="number" />
          <TextControl label="वर्ष" value="" type="number" />
        </div>
      )}
    </div>
  )
}
