import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { TextControl } from "@/components/ui/TextControl"

export function ConvergenceDetails() {
  const [bankLoan, setBankLoan] = useState("हाँ")
  const [nrlmLoan, setNrlmLoan] = useState("हाँ")
  return (
    <section className="convergence-details">
      <h4>अभिसरण विवरण</h4>
      <div className="convergence-row">
        <ChipField label="बैंक ऋण">
          <ChipGroup
            options={["हाँ", "नहीं"]}
            selected={[bankLoan]}
            onToggle={setBankLoan}
            single
          />
        </ChipField>
        {bankLoan === "हाँ" && (
          <div className="control-grid">
            <TextControl label="राशि ₹" value="50,000" type="number" />
            <TextControl label="वर्ष" value="2026" type="number" />
          </div>
        )}
      </div>
      <div className="convergence-row">
        <ChipField label="NRLM ऋण CIF/CEF">
          <ChipGroup
            options={["हाँ", "नहीं"]}
            selected={[nrlmLoan]}
            onToggle={setNrlmLoan}
            single
          />
        </ChipField>
        {nrlmLoan === "हाँ" && (
          <div className="control-grid">
            <TextControl label="राशि ₹" value="30,000" type="number" />
            <TextControl label="वर्ष" value="2025" type="number" />
          </div>
        )}
      </div>
      {[
        ["IFR पट्टा लाभार्थी", "हाँ"],
        ["गाँव में CFR पट्टा", "हाँ"],
        ["PMFME लाभ स्थिति", "आवेदन लंबित"],
        ["RSETI/DDU-GKY प्रशिक्षण स्थिति", "प्रशिक्षण पूर्ण"],
      ].map(([label, value]) => (
        <div className="convergence-select" key={label}>
          <span>{label}</span>
          <select defaultValue={value}>
            {label.includes("स्थिति") ? (
              <>
                <option>प्राप्त</option>
                <option>आवेदन लंबित</option>
                <option>प्रशिक्षण पूर्ण</option>
                <option>आवेदन नहीं</option>
              </>
            ) : (
              <>
                <option>हाँ</option>
                <option>नहीं</option>
              </>
            )}
          </select>
        </div>
      ))}
    </section>
  )
}
