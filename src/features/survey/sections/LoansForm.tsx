import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { Icon } from "@/components/ui/Icon"
import type { LoanEntry } from "@/features/survey/types"
import { useTr } from "@/i18n/tr"

export function LoansForm() {
  const tr = useTr()
  const [expanded, setExpanded] = useState(0)
  const [loans, setLoans] = useState<LoanEntry[]>([
    {
      source: "SHG/VO/CLF (CIF/CEF)",
      taken: "हाँ",
      purpose: "कृषि निवेश",
      principal: 30000,
      outstanding: 12000,
      rate: 12,
      year: 2025,
    },
    {
      source: "बैंक/PACS",
      taken: "हाँ",
      purpose: "KCC फसल ऋण",
      principal: 50000,
      outstanding: 28000,
      rate: 7,
      year: 2026,
    },
    {
      source: "MFI/NBFC",
      taken: "नहीं",
      purpose: "",
      principal: 0,
      outstanding: 0,
      rate: 0,
      year: 2026,
    },
    {
      source: "साहूकार/अनौपचारिक",
      taken: "हाँ",
      purpose: "चिकित्सा व्यय",
      principal: 15000,
      outstanding: 10000,
      rate: 30,
      year: 2026,
    },
  ])
  const updateLoan = (index: number, patch: Partial<LoanEntry>) =>
    setLoans(loans.map((loan, loanIndex) => (loanIndex === index ? { ...loan, ...patch } : loan)))
  const total = loans.reduce((sum, loan) => sum + loan.outstanding, 0)
  const highRisk = loans.some(
    (loan) => loan.source.startsWith("साहूकार") && loan.taken === "हाँ" && loan.rate > 24,
  )
  return (
    <div className="section-form loan-section">
      <p className="section-help">
        {tr("सभी औपचारिक और अनौपचारिक ऋण दर्ज करें। बकाया राशि स्वतः जोड़ी जाएगी।")}
      </p>
      <div className="expandable-list">
        {loans.map((loan, index) => (
          <div className={`expandable-card ${expanded === index ? "open" : ""}`} key={loan.source}>
            <button
              className="expandable-head"
              onClick={() => setExpanded(expanded === index ? -1 : index)}
            >
              <span className={`source-dot ${loan.taken === "हाँ" ? "active" : ""}`} />
              <strong>{tr(loan.source)}</strong>
              <span>
                {loan.taken === "हाँ"
                  ? tr("बकाया ₹{{amount}}", { amount: loan.outstanding.toLocaleString("en-IN") })
                  : tr("ऋण नहीं")}
              </span>
              <b>{expanded === index ? "−" : "+"}</b>
            </button>
            {expanded === index && (
              <div className="expandable-body">
                <ChipField label="ऋण लिया?">
                  <ChipGroup
                    options={["हाँ", "नहीं"]}
                    selected={[loan.taken]}
                    onToggle={(value) => updateLoan(index, { taken: value })}
                    single
                  />
                </ChipField>
                {loan.taken === "हाँ" && (
                  <>
                    <label className="loan-purpose">
                      <span>{tr("उद्देश्य")}</span>
                      <input
                        value={tr(loan.purpose)}
                        onChange={(event) => updateLoan(index, { purpose: event.target.value })}
                      />
                    </label>
                    <div className="loan-fields">
                      {[
                        ["मूलधन ₹", "principal"],
                        ["बकाया ₹", "outstanding"],
                        ["ब्याज दर % वार्षिक", "rate"],
                        ["वर्ष", "year"],
                      ].map(([label, key]) => (
                        <label key={key}>
                          <span>{tr(label)}</span>
                          <input
                            type="number"
                            value={loan[key as keyof LoanEntry] as number}
                            onChange={(event) =>
                              updateLoan(index, {
                                [key]: Number(event.target.value),
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="loan-footer">
        <span>{tr("कुल बकाया (स्वतः)")}</span>
        <strong>₹{total.toLocaleString("en-IN")}</strong>
      </div>
      {highRisk && (
        <div className="risk-warning">
          <Icon name="alert" size={16} />
          <div>
            <strong>{tr("उच्च-ब्याज ऋण जोखिम")}</strong>
            <span>
              {tr("साहूकार की वार्षिक ब्याज दर 24% से अधिक है। बैंक/SHG पुनर्वित्त देखें।")}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
